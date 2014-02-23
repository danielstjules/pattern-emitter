var util = require('util');
var EventEmitter = require('events').EventEmitter;

function PatternEmitter() {
  EventEmitter.call(this);

  this.event = '';

  this._events = this._events || {};
  this._patternEvents = this._patternEvents || {};
  this._regexes = this._regexes || {};
}

util.inherits(PatternEmitter, EventEmitter);
module.exports = PatternEmitter;

// Store EventEmitter's emit as a private method

PatternEmitter.prototype._emit = PatternEmitter.prototype.emit;

// Public methods below

PatternEmitter.prototype.emit = function(type) {
  var listeners, result, error;

  if (typeof type !== 'string') {
    throw TypeError('type must be a string');
  }

  this.event = type;

  listeners = this._events[type];
  this._events[type] = this._getMatching(type);

  try {
    result = this._emit.apply(this, arguments);
  } catch (err) {
    error = err;
  }

  this._events[type] = listeners;

  if (error) throw error;

  return result;
};

PatternEmitter.prototype.addPatternListener = function(pattern, listener) {
  if (typeof pattern !== 'string') {
    throw TypeError('pattern must be a string');
  }

  this.event = 'newListener';
  PatternEmitter._apply(this, this.addListener, pattern, [pattern, listener]);

  if (!this._regexes[pattern]) {
    this._regexes[pattern] = new RegExp(pattern);
  }

  return this;
};

PatternEmitter.prototype.onPattern = PatternEmitter.prototype.addPatternListener;

PatternEmitter.prototype.onceOnPattern = function(pattern, listener) {
  if (typeof pattern !== 'string') {
    throw TypeError('pattern must be a string');
  }

  if (typeof listener !== 'function') {
    throw TypeError('listener must be a function');
  }

  var invoked = false;

  function invokeOnce() {
    this.removePatternListener(pattern, invokeOnce);

    if (!invoked) {
      invoked = true;
      listener.apply(this, arguments);
    }
  }

  invokeOnce.listener = listener;
  this.onPattern(pattern, invokeOnce);

  return this;
};

PatternEmitter.prototype.removePatternListener = function(pattern, listener) {
  if (typeof pattern !== 'string') {
    throw TypeError('pattern must be a string');
  }

  this.event = 'removeListener';
  PatternEmitter._apply(this, this.removeListener, pattern,
    [pattern, listener]);

  if (!this._patternEvents[pattern] || !this._patternEvents[pattern].length) {
    delete this._patternEvents[pattern];
  }

  if (!this._patternEvents[pattern] && this._regexes[pattern]) {
    delete this._regexes[pattern];
  }

  return this;
};

PatternEmitter.prototype.removeAllPatternListeners = function(pattern) {
  if (typeof pattern !== 'string') {
    throw TypeError('pattern must be a string');
  }

  this.event = 'removeListener';
  PatternEmitter._apply(this, this.removeAllListeners, pattern, [pattern]);

  delete this._patternEvents[pattern];

  if (this._regexes[pattern]) {
    delete this._regexes[pattern];
  }

  return this;
};

PatternEmitter.prototype.patternListeners = function(pattern) {
  if (typeof pattern !== 'string') {
    throw TypeError('pattern must be a string');
  }

  return PatternEmitter._apply(this, this.listeners, pattern, [pattern]);
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

PatternEmitter.patternListenerCount = function(emitter, pattern) {
  if (typeof pattern !== 'string') {
    throw TypeError('pattern must be a string');
  }

  return PatternEmitter._apply(emitter, EventEmitter.listenerCount, pattern,
    [emitter, pattern]);
};

PatternEmitter.matchingListenerCount = function(emitter, type) {
  return emitter.matchingListeners(type).length;
};

// Remaining private methods

PatternEmitter.prototype._getMatching = function(type) {
  var matching, listeners;

  // Get any regular listeners
  matching = this._events[type];

  if (typeof type !== 'string') {
    return matching;
  }

  // Retrieve all pattern listeners
  for (var pattern in this._regexes) {
    var regex = this._regexes[pattern];
    if (!regex || !(regex instanceof RegExp)) {
      continue;
    }

    if (regex.test(type)) {
      if (!matching) {
        matching = this._patternEvents[pattern];
      } else {
        listeners = this._patternEvents[pattern];
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

PatternEmitter._apply = function(emitter, fn, pattern, args) {
  // Swap patternEvents and events before running, allowing us to piggyback
  // off EventEmitter
  var typeListeners, error, result;

  typeListeners = emitter._events[pattern];
  emitter._events[pattern] = emitter._patternEvents[pattern];

  try {
    result = fn.apply(emitter, args);
  } catch (err) {
    error = err;
  }

  emitter._patternEvents[pattern] = emitter._events[pattern];
  emitter._events[pattern] = typeListeners;

  if (error) throw error;

  return result;
};
