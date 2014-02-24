pattern-emitter
===============

Event emitters with support for regular expressions. Inherits from Node's
EventEmitter.

[![Build Status](https://travis-ci.org/danielstjules/pattern-emitter.png)](https://travis-ci.org/danielstjules/pattern-emitter)

* [Installation](#installation)
* [Overview](#overview)
* [Compatibility](#compatibility)
* [Class: PatternEmitter](#class-patternemitter)
* [Instance Methods](#instance-methods)
    * [emitter.addListener(event | pattern, listener)](#emitteraddlistenerevent--pattern-listener)
    * [emitter.emit(event, \[arg1\], \[arg2\], \[...\])](#emitteremitevent-91arg193-91arg293-9193)
    * [emitter.listeners(event)](#emitterlistenersevent)
    * [emitter.matchingListeners(pattern)](#emittermatchinglistenerspattern)
    * [emitter.on(event | pattern, listener)](#emitteronevent--pattern-listener)
    * [emitter.once(event | pattern, listener)](#emitteronceevent--pattern-listener)
    * [emitter.patternListeners(pattern)](#emitterpatternlistenerspattern)
    * [emitter.removeAllListeners(event | pattern)](#emitterremovealllistenersevent--pattern)
    * [emitter.removeListener(event | pattern, listener)](#emitterremovelistenerevent--pattern-listener)
    * [emitter.setMaxListeners(n)](#emittersetmaxlistenersn)
* [Class Methods](#class-methods)
    * [PatternEmitter.listenerCount(emitter, event)](#patternemitterlistenercountemitter-event)
    * [PatternEmitter.matchingListenerCount(emitter, event)](#patternemittermatchinglistenercountemitter-event)
    * [PatternEmitter.patternListenerCount(emitter, pattern)](#patternemitterpatternlistenercountemitter-pattern)

## Installation

Using npm, you can install pattern-emitter with `npm install pattern-emitter`.
You can also require it as a dependency in your `package.json` file:

```
"dependencies": {
    "pattern-emitter": ">0.0.0"
}
```

## Overview

The PatternEmitter class both extends and is backwards compatible with
EventEmitter when dealing with string event types. However, when registering
a listener to a RegExp, it has the added benefit of listening to all events
matching the expression, rather than that particular object. In addition, it
exposes a new set of methods on top of the existing API for requesting details
on those patterns and their listeners. As a result, getting started with this
library is as simple as replacing instances of:

```
var Emitter = require('events').EventEmitter; // Node 0.10.x
var Emitter = require('events');              // Node 0.12.x
```

with:

```
var Emitter = require('pattern-emitter');
```

Afterwards, you're ready to start listening to patterns.

``` javascript
var emitter = new Emitter();
var result;

emitter.on(/^example/, function(arg1, arg2) {
  result = arg1 + ' ' + arg2;
});

emitter.emit('exampleEvent', "It's", 'that simple');
console.log(result); // "It's that simple"
```

## Compatibility

The use of PatternEmitter is backwards compatible with EventEmitter for all
who haven't been registering listeners to instances of `RegExp`. I suspect
that this covers a great majority of event use.

## Class: PatternEmitter

As with EventEmitter, when a PatternEmitter experiences an error, it emits
an `error` event. If no listeners exist for the event, then by default, a stack
trace is printed and the program is closed.

Furthermore, all PatternEmitters emit the `newListener` event when new listeners
are added, and `removeListener` when removed.

These string events are treated like any other, and may be caught by a listener
registered to a matching pattern, e.g. `/.*/`.

## Instance Methods

In the following examples, let `emitter` be an instance of `PatternEmitter`.
Furthermore, let `pattern` refer to any instance of `RegExp`, and `event`
all other values.

#### emitter.addListener(event | pattern, listener)

Given a RegExp event type, stores the regular expression and registers the
listener to any events matching the pattern. Otherwise, it behaves exactly
as EventEmitter. As with EventEmitter.prototype.addListener, it emits a
newListener' event on success. Returns an instance of itself.

#### emitter.emit(event, \[arg1\], \[arg2\], \[...\])

Emits an event to all listeners for the specified type. In addition, if type
is a string, emits the event to all listeners whose patterns match. Returns
true if any listeners existed, false otherwise.

#### emitter.listeners(event)

Returns an array of listeners for the given event.

#### emitter.matchingListeners(pattern)

Returns an array of listeners for the supplied event type, and whose
patterns match the event if given a string.

#### emitter.on(event | pattern, listener)

An alias for addListener.

#### emitter.once(event | pattern, listener)

Adds a one time listener for an event or pattern. The listener is invoked only
once after an event is fired, after which it is removed.

#### emitter.patternListeners(pattern)

Returns an array of pattern listeners for the specified RegExp.

#### emitter.removeAllListeners(event | pattern)

Removes all listeners for the specified event type. If given an instance of
RegExp, it matches the RegExp object with the same expression. Emits a
'removeListener' event for each removed listener. Returns an instance of
itself.

#### emitter.removeListener(event | pattern, listener)

Removes the listener from the specified event type. If given an instance of
RegExp, it matches any RegExp object with the same expression. Emits a
'removeListener' event on success. Returns an instance of itself.

#### emitter.setMaxListeners(n)

By default, PatternEmitters will print a warning once more than 10 listeners
are added for a particular event. This may be used to modify that threshold.
Setting to 0 will disable the threshold altogether.

## Class Methods

In the outline below, let `pattern` refer to any instance of `RegExp`, and
`event` all other values.

#### PatternEmitter.listenerCount(emitter, event)

Return the number of listeners for a given event.

#### PatternEmitter.matchingListenerCount(emitter, event)

Returns the number of listeners and pattern listeners registered to the
emitter for the event type or a matching pattern.

#### PatternEmitter.patternListenerCount(emitter, pattern)

Returns the number of listeners registered to the emitter for the specified
pattern.
