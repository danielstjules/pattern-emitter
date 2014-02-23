var util = require('util');
var EventEmitter = require('events').EventEmitter;

/**
 * Creates a new PatternEmitter, which extends EventEmitter. In addition to
 * EventEmitter's prototype, it exposes pattern-specific methods for listening
 * to events matching a RegExp.
 *
 * @constructor
 * @extends EventEmitter
 *
 * @property {*} event The type of the last emitted event
 */
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

/**
 * Emits an event to all listeners for the specified type. In addition, if type
 * is a string, emits the event to all listeners whose patterns match. Returns
 * an instance of itself.
 *
 * @param {*}    type   The type of event to emit
 * @param {...*} [args] Arguments to apply when invoking the listeners
 *
 * @returns {PatternEmitter} This instance
 * @throws  {Error}          If an error occurs and no error listener exists
 */
PatternEmitter.prototype.emit = function(type) {
  var listeners, result, error;

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

/**
 * Given a string pattern, creates and stores a regular expression to listen to
 * any matching events. As with EventEmitter.prototype.addListener, it emits
 * a 'newListener' event on success. Returns an instance of itself.
 *
 * @param {string}   pattern  The string regex pattern to match
 * @param {function} listener The listener to invoke
 *
 * @returns {PatternEmitter} This instance
 * @throws  {TypeError}      If pattern is not a string, or listener is not
 *                           a function
 */
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

/**
 * An alias for addPatternListener
 *
 * @see addPatternListener
 */
PatternEmitter.prototype.onPattern = PatternEmitter.prototype.addPatternListener;

/**
 * Given a string pattern, creates and stores a regular expression to listen to
 * any matching events, and invokes the listener at most once. After the
 * listener has been invoked, it's removed. As with EventEmitter.prototype.once,
 * this method emits a 'removeListener' event on success. Returns an instance
 * of itself.
 *
 * @param {string}   pattern  The string pattern to match at most once
 * @param {function} listener The listener to invoke
 *
 * @returns {PatternEmitter} This instance
 * @throws  {TypeError}      If pattern is not a string, or listener is not
 *                           a function
 */
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

/**
 * Removes the pattern listener from the specified pattern. Emits a
 * 'removeListener' event on success. Returns an instance of itself.
 *
 * @param {string}   pattern  The string pattern from which to remove
 * @param {function} listener The listener to remove
 *
 * @returns {PatternEmitter} This instance
 * @throws  {TypeError}      If pattern is not a string, or listener is not
 *                           a function
 */
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

/**
 * Removes all pattern listeners for the given pattern. Emits a 'removeListener'
 * event for each removed listener. Returns an instance of itself.
 *
 * @param {string}   pattern  The string pattern from which to remove
 * @param {function} listener The listener to remove
 *
 * @returns {PatternEmitter} This instance
 * @throws  {TypeError}      If pattern is not a string
 */
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

/**
 * Returns an array of pattern listeners for the specified pattern.
 *
 * @param {string} pattern The string pattern
 *
 * @returns {function[]} An array of listeners
 * @throws  {TypeError}  If pattern is not a string
 */
PatternEmitter.prototype.patternListeners = function(pattern) {
  if (typeof pattern !== 'string') {
    throw TypeError('pattern must be a string');
  }

  return PatternEmitter._apply(this, this.listeners, pattern, [pattern]);
};

/**
 * Returns an array of listeners for the given event type, and whose patterns
 * match the event if type is a string.
 *
 * @param {*} type The type of event
 *
 * @returns {function[]} An array of listeners
 */
PatternEmitter.prototype.matchingListeners = function(type) {
  var matching = this._getMatching(type);

  if (!matching) {
    matching = [];
  } else if (!(matching instanceof Array)) {
    matching = [matching];
  }

  return matching;
};

/**
 * Returns the number of pattern listeners registered to the emitter for the
 * specified pattern.
 *
 * @param {PatternEmitter} emitter The emitter for which to count listeners
 * @param {string}         pattern The string pattern
 *
 * @returns {int}       The number of listeners
 * @throws  {TypeError} If pattern is not a string
 */
PatternEmitter.patternListenerCount = function(emitter, pattern) {
  if (typeof pattern !== 'string') {
    throw TypeError('pattern must be a string');
  }

  return PatternEmitter._apply(emitter, EventEmitter.listenerCount, pattern,
    [emitter, pattern]);
};

/**
 * Returns the number of listeners and pattern listeners registered to the
 * emitter for the event type or a matching pattern.
 *
 * @param {PatternEmitter} emitter The emitter for which to count listeners
 * @param {*}              type    The event type
 *
 * @returns {int} The number of listeners
 */
PatternEmitter.matchingListenerCount = function(emitter, type) {
  return emitter.matchingListeners(type).length;
};

/**
 * Returns all listeners for the given type, and if type is a string, matching
 * pattern listeners.
 *
 * @param {*} type The event type
 *
 * @returns {function|function[]} All relevant listeners
 */
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

/**
 * A helper function to invoke an EventEmitter action in the context of
 * pattern listeners. This allows us to re-use EventEmitter's logic and API.
 *
 * @param {PatternEmitter} emitter The emitter on which to invoke the function
 * @param {function}       fn      The function to invoke
 * @param {pattern}        pattern The string pattern to which this applies
 * @param {*[]}            args    An array of arguments to apply to fn
 *
 * @returns {*} The function's return value
 */
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
