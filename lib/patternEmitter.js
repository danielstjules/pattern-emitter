var util = require('util');
var EventEmitter = require('events').EventEmitter;

function PatternEmitter() {
  EventEmitter.call(this);

  this.event = '';

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

PatternEmitter.prototype._emit = PatternEmitter.prototype.emit;

PatternEmitter.prototype._once = PatternEmitter.prototype.once;

PatternEmitter.prototype._addListener = PatternEmitter.prototype.addListener;

PatternEmitter.prototype._removeListener = PatternEmitter.prototype.removeListener;

PatternEmitter.prototype._removeAllListeners = PatternEmitter.prototype.removeAllListeners;

PatternEmitter.prototype._listeners = PatternEmitter.prototype.listeners;

PatternEmitter.prototype._getMatching = function(type) {
  var matching, listeners;

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
  var listeners, result;

  if (typeof type !== 'string') {
    throw TypeError('type must be a string');
  }

  this.event = type;

  listeners = this._events[type];
  this._events[type] = this._getMatching(type);

  try {
    result = this._emit.apply(this, arguments);
  } catch (err) {
    throw new Error(err.message);
  } finally {
    this._events[type] = listeners;
  }

  return result;
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

PatternEmitter.matchingListenerCount = function(emitter, type) {
  return emitter.matchingListeners(type).length;
};
