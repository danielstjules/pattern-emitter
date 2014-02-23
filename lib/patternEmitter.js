var util = require('util');
var EventEmitter = require('events').EventEmitter;

function PatternEmitter() {
  EventEmitter.call(this);

  if (!this._events) {
    this._events = {};
  }

  if (!this._regexes) {
    this._regexes = {};
  }
}

util.inherits(PatternEmitter, EventEmitter);
module.exports = PatternEmitter;

// Store EventEmitter methods as private methods

PatternEmitter.prototype._addListener = PatternEmitter.prototype.addListener;

PatternEmitter.prototype._removeListener = PatternEmitter.prototype.removeListener;

PatternEmitter.prototype._removeAllListeners = PatternEmitter.prototype.removeAllListeners;

PatternEmitter.prototype._listeners = PatternEmitter.prototype.listeners;

PatternEmitter.prototype._emit = PatternEmitter.prototype.emit;

PatternEmitter.prototype._getMatching = function(type) {
  var matching, listners;

  for (var pattern in this._regexes) {
    var regex = this._regexes[pattern];
    if (!regex || !(regex instanceof RegExp)) {
      continue;
    }

    if (regex.test(type)) {
      if (!matching) {
        matching = this._events[pattern];
      } else {
        listeners = this._events[pattern];
        if (!(listeners instanceof Array)) {
          listeners = [listeners];
        }

        if (!(matching instanceof Array)) {
          matching = [matching];
        }
        matching = matching.concat(listeners);
      }
    }
  }

  return matching;
};

// Public methods below

PatternEmitter.prototype.emit = function(type) {
  if (typeof type !== 'string') {
    throw TypeError('type must be a string');
  }

  var error, handler, length, args, i, listeners;

  // This bit of logic is taken straight from node/lib/events.js
  if (type === 'error' && !this._events.error) {
    error = arguments[1];

    if (this.domain) {
      if (!error) error = new Error('Uncaught, unspecified "error" event.');

      error.domainEmitter = this;
      error.domain = this.domain;
      error.domainThrown = false;
      this.domain.emit('error', error);
    } else if (error instanceof Error) {
      throw error; // Unhandled 'error' event
    } else {
      throw Error('Uncaught, unspecified "error" event.');
    }

    return false;
  }

  handler = this._getMatching(type);

  if (!handler) return false;

  if (this.domain && this !== process) this.domain.enter();

  if (typeof handler === 'function') {
    // Add the event as a property
    handler.event = type;
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++) {
          args[i - 1] = arguments[i];
        }
        handler.apply(this, args);
    }
  } else if (typeof handler === 'object') {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++) {
      // Once again, add the event type as a property
      listeners[i].event = type;
      listeners[i].apply(this, args);
    }
  }

  if (this.domain && this !== process) {
    this.domain.exit();
  }

  return true;
};

PatternEmitter.prototype.addListener = function(pattern, listener) {
  if (typeof pattern !== 'string') {
    throw TypeError('pattern must be a string');
  }

  this._addListener(pattern, listener);

  if (!this._regexes[pattern]) {
    this._regexes[pattern] = new RegExp(pattern);
  }

  return this;
};

PatternEmitter.prototype.on = PatternEmitter.prototype.addListener;

PatternEmitter.prototype.once = function(pattern, listener) {
  if (typeof pattern !== 'string') {
    throw TypeError('pattern must be a string');
  }

  this._once(pattern, listener);

  return this;
};

PatternEmitter.prototype.removeListener = function(pattern, listener) {
  if (typeof pattern !== 'string') {
    throw TypeError('pattern must be a string');
  }

  this._removeListener(pattern, listener);

  if (!this._events[pattern] && this._regexes[pattern]) {
    delete this._regexes[pattern];
  }

  return this;
};

PatternEmitter.prototype.removeAllListeners = function(pattern) {
  if (typeof pattern !== 'string') {
    throw TypeError('pattern must be a string');
  }

  this._removeAllListeners(pattern);

  if (this._regexes[pattern]) {
    delete this._regexes[pattern];
  }

  return this;
};

PatternEmitter.prototype.listeners = function(pattern) {
  if (typeof pattern !== 'string') {
    throw TypeError('pattern must be a string');
  }

  return this._listeners(pattern);
};

PatternEmitter.prototype.matchingListeners = function(type) {
  if (typeof type !== 'string') {
    throw TypeError('type must be a string');
  }

  var matching = this._getMatching(type);

  if (!matching) {
    matching = [];
  } else if (!(matching instanceof Array)) {
    matching = [matching];
  }

  return matching;
};

PatternEmitter.listenerCount = function(emitter, pattern) {
  if (typeof pattern !== 'string') {
    throw TypeError('pattern must be a string');
  }

  return EventEmitter.listenerCount(emitter, pattern);
};
