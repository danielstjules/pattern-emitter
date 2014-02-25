var util = require('util');
var EventEmitter = require('events').EventEmitter;

var domain;

/**
 * Creates a new PatternEmitter, which extends EventEmitter. In addition to
 * EventEmitter's prototype, it allows listeners to register to events matching
 * a RegExp.
 *
 * @constructor
 * @extends EventEmitter
 *
 * @property {*} event The type of the last emitted event
 */
function PatternEmitter() {
  EventEmitter.call(this);

  this.event = '';
  this._regexesCount = 0;

  this._events = this._events || {};
  this._patternEvents = this._patternEvents || {};
  this._regexes = this._regexes || {};
}

util.inherits(PatternEmitter, EventEmitter);
module.exports = PatternEmitter;

// Store overridden EventEmitter methods as private

PatternEmitter.prototype._emit = PatternEmitter.prototype.emit;

PatternEmitter.prototype._addListener = PatternEmitter.prototype.addListener;

PatternEmitter.prototype._removeListener = PatternEmitter.prototype.removeListener;

PatternEmitter.prototype._removeAllListeners = PatternEmitter.prototype.removeAllListeners;

/**
 * Emits an event to all listeners for the specified type. In addition, if type
 * is a string, emits the event to all listeners whose patterns match. Returns
 * true if any listeners existed, false otherwise.
 *
 * @param {*}    type   The type of event to emit
 * @param {...*} [args] Arguments to apply when invoking the listeners
 *
 * @returns {PatternEmitter} This instance
 * @throws  {Error}          If an error occurs and no error listener exists
 */
PatternEmitter.prototype.emit = function(type) {
  var listeners, result, error;

  // Optimize for the case where no pattern listeners exit
  if (!this._regexesCount) {
    return this._emit.apply(this, arguments);
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

/**
 * Given a RegExp event type, stores the regular expression and registers the
 * listener to any events matching the pattern. Otherwise, it behaves exactly
 * as EventEmitter. As with EventEmitter.prototype.addListener, it emits a
 * 'newListener' event on success. Returns an instance of itself.
 *
 * @param {*}        type     The event type to match, including a RegExp to
 *                            match using a pattern
 * @param {function} listener The listener to invoke
 *
 * @returns {PatternEmitter} This instance
 * @throws  {TypeError}      If listener is not a function
 */
PatternEmitter.prototype.addListener = function(type, listener) {
  if (!(type instanceof RegExp)) {
    return this._addListener(type, listener);
  }

  var pattern = String(type);
  this.event = 'newListener';
  this._regexesCount++;

  PatternEmitter._apply(this, this._addListener, pattern, [pattern, listener]);

  if (!this._regexes[pattern]) {
    this._regexes[pattern] = type;
  }

  return this;
};

/**
 * An alias for addListener.
 *
 * @see addListener
 */
PatternEmitter.prototype.on = PatternEmitter.prototype.addListener;

/**
 * Removes the listener from the specified event type. If given an instance of
 * RegExp, it matches any RegExp object with the same expression. Emits a
 * 'removeListener' event on success. Returns an instance of itself.
 *
 * @param {*}        type     The event type, including a RegExp, to remove
 * @param {function} listener The listener to remove
 *
 * @returns {PatternEmitter} This instance
 * @throws  {TypeError}      If listener is not a function
 */
PatternEmitter.prototype.removeListener = function(type, listener) {
  if (!(type instanceof RegExp)) {
    return this._removeListener(type, listener);
  }

  var pattern = String(type);
  this.event = 'removeListener';
  this._regexesCount--;

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
 * Removes all listeners for the specified event type. If given an instance of
 * RegExp, it matches the RegExp object with the same expression. Emits a
 * 'removeListener' event for each removed listener. Returns an instance of
 * itself.
 *
 * @param {*} type The event type, including a RegExp, to remove
 *
 * @returns {PatternEmitter} This instance
 */
PatternEmitter.prototype.removeAllListeners = function(type) {
  if (!(type instanceof RegExp)) {
    return this._removeAllListeners(type);
  }

  var pattern = String(type);
  this.event = 'removeListener';

  PatternEmitter._apply(this, this.removeAllListeners, pattern, [pattern]);

  delete this._patternEvents[pattern];

  if (this._regexes[pattern]) {
    delete this._regexes[pattern];
  }

  return this;
};

/**
 * Returns an array of pattern listeners for the specified RegExp.
 *
 * @param {RegExp} pattern A RegExp
 *
 * @returns {function[]} An array of listeners
 * @throws  {TypeError}  If pattern is not a RegExp
 */
PatternEmitter.prototype.patternListeners = function(pattern) {
  if (!(pattern instanceof RegExp)) {
    throw TypeError('pattern must be an instance of RegExp');
  }

  return PatternEmitter._apply(this, this.listeners, pattern, [pattern]);
};

/**
 * Returns an array of listeners for the supplied event type, and whose
 * patterns match the event if given a string.
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
 * Returns the number of listeners for a given event. An alias for
 * EventEmitter.listenerCount.
 *
 * @see EventEmitter.listenerCount
 *
 * @param {PatternEmitter} emitter The emitter for which to count listeners
 * @param {*}              type    The event type
 *
 * @returns {int} The number of listeners
 */
PatternEmitter.listenerCount = function(emitter, type) {
  return EventEmitter.listenerCount(emitter, type);
};

/**
 * Returns the number of listeners registered to the emitter for the specified
 * pattern.
 *
 * @param {PatternEmitter} emitter The emitter for which to count listeners
 * @param {RegExp}         pattern A RegExp
 *
 * @returns {int}       The number of listeners
 * @throws  {TypeError} If pattern is not a string
 */
PatternEmitter.patternListenerCount = function(emitter, pattern) {
  if (!(pattern instanceof RegExp)) {
    throw TypeError('pattern must be an instance of RegExp');
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

    if (!regex.test(type)) continue;

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
