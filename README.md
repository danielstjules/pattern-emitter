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
    * [emitter.emit(event, \[arg1\], \[arg2\], \[...\])](#emitteremitevent-arg1-arg2-)
    * [emitter.listeners(event)](#emitterlistenersevent)
    * [emitter.matchingListeners(event)](#emittermatchinglistenersevent)
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
* [Events](#events)
    * [newListener](#newlistener)
    * [removeListener](#removelistener)
* [Performance](#performance)

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

``` javascript
var Emitter = require('events').EventEmitter; // Node 0.10.x
var Emitter = require('events');              // Node 0.12.x
```

with:

``` javascript
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

When a listener is invoked, it's given the event name as a property, which is
accessible via `this.event`.

#### emitter.addListener(event | pattern, listener)

Given a RegExp event type, stores the regular expression and registers the
listener to any events matching the pattern. Otherwise, it behaves exactly
as EventEmitter. As with EventEmitter.prototype.addListener, it emits a
newListener' event on success. Returns an instance of itself.

``` javascript
emitter.addListener('userCreated', function(object) {
  console.log('Listener:', this.event);
});

emitter.addListener(/user/, function(object) {
  console.log('Pattern Listener:', this.event);
});

emitter.emit('userCreated', {id: 10, username: 'Alice'});
// Listener: userCreated
// Pattern Listener: userCreated

emitter.emit('userUpdated', {id: 19, username: 'Bob'});
// Pattern Listener: userUpdated
```

#### emitter.emit(event, \[arg1\], \[arg2\], \[...\])

Emits an event to all listeners for the specified type. In addition, if type
is a string, emits the event to all listeners whose patterns match. Returns
true if any listeners existed, false otherwise.

``` javascript
emitter.addListener(/^namespace:entry:1\d{4}$/, function() {
  // Handler for entries within the given range: 10000-19999
});

emitter.emit('namespace:entry:12345'); // true
emitter.emit('namespace:entry:20000'); // false
```

#### emitter.listeners(event)

Returns an array of listeners for the given event.

``` javascript
emitter.addListener('foo:1:newBar', function() {
  console.log('event listener');
});

emitter.addListener(/^foo:[0-9]+:newBar$/, function() {
  console.log('pattern listener');
});

var listeners = emitter.listeners('foo:1:newBar');
console.log(listeners.length); // 1
listeners[0]();                // 'event listener'
```

#### emitter.matchingListeners(event)

Returns an array of listeners for the supplied event type, and whose
patterns match the event if given a string.

``` javascript
emitter.addListener('foo:1:newBar', function() {
  console.log('event listener');
});

emitter.addListener(/^foo:[0-9]+:newBar$/, function() {
  console.log('pattern listener');
});

var listeners = emitter.matchingListeners('foo:1:newBar');
console.log(listeners.length); // 2
listeners[0]();                // 'event listener'
listeners[1]();                // 'pattern listener'
```

#### emitter.on(event | pattern, listener)

An alias for addListener.

``` javascript
emitter.on(/.*/, function() {
  // Listen to all events, including 'error', 'newListener',
  // and 'removeListener'
});
```

#### emitter.once(event | pattern, listener)

Adds a one time listener for an event or pattern. The listener is invoked only
once after an event is fired, after which it is removed.

``` javascript
var counter = 0;
emitter.once(/foo:[0-9]+:updated$/, function() {
  counter++;
});

emitter.emit('app:foo:81:updated');
emitter.emit('app:foo:92:updated');
console.log(counter); // 1
```

#### emitter.patternListeners(pattern)

Returns an array of pattern listeners for the specified RegExp.

``` javascript
emitter.on(/.*/, function() {
  // Example pattern listener
});

emitter.on('/.*/', function() {
 // Won't be included in the results below
});

var count = emitter.patternListeners(/.*/).length; // 1
```

#### emitter.removeAllListeners(event | pattern)

Removes all listeners for the specified event type. If given an instance of
RegExp, it matches the RegExp object with the same expression. Emits a
'removeListener' event for each removed listener. Returns an instance of
itself.

``` javascript
emitter.addListener(/foo:.*[0-9]+/, function() {});
emitter.addListener(/foo:.*[0-9]+/, function() {});
emitter.addListener('/foo:.*[0-9]+/', function() {});

var count = emitter.patternListeners(/foo:.*[0-9]+/).length; // 2

emitter.removeAllListeners(/foo:.*[0-9]+/);
count = emitter.patternListeners(/foo:.*[0-9]+/).length; // 0
```

#### emitter.removeListener(event | pattern, listener)

Removes the listener from the specified event type. If given an instance of
RegExp, it matches any RegExp object with the same expression. Emits a
'removeListener' event on success. Returns an instance of itself.

``` javascript
var listener = function() {
  // Example event listener
};

emitter.addListener(/foo:.*[0-9]+/, listener);
emitter.addListener(/foo:.*[0-9]+/, function() {});

var count = emitter.patternListeners(/foo:.*[0-9]+/).length; // 2

emitter.removeListener(/foo:.*[0-9]+/, listener);
count = emitter.patternListeners(/foo:.*[0-9]+/).length; // 1
```

#### emitter.setMaxListeners(n)

By default, PatternEmitters will print a warning once more than 10 listeners
are added for a particular event. This may be used to modify that threshold.
Setting to 0 will disable the threshold altogether.

``` javascript
emitter.setMaxListeners(1);
emitter.on(/^foo.*/, function() {});
emitter.on(/^foo.*/, function() {});

// (node) warning: possible EventEmitter memory leak detected. 2 listeners
// added. Use emitter.setMaxListeners() to increase limit.
```

## Class Methods

In the outline below, let `pattern` refer to any instance of `RegExp`, and
`event` all other values.

#### PatternEmitter.listenerCount(emitter, event)

Returns the number of listeners for a given event. An alias for
EventEmitter.listenerCount.

``` javascript
emitter.on('foo', function() {});
emitter.on(/foo/, function() {});

PatternEmitter.listenerCount(emitter, 'foo'); // 1
```

#### PatternEmitter.matchingListenerCount(emitter, event)

Returns the number of listeners and pattern listeners registered to the
emitter for the event type or a matching pattern.

``` javascript
emitter.on('foo', function() {});
emitter.on(/foo/, function() {});

PatternEmitter.matchingListenerCount(emitter, 'foo'); // 2
```

#### PatternEmitter.patternListenerCount(emitter, pattern)

Returns the number of listeners registered to the emitter for the specified
pattern.

``` javascript
emitter.on('foo', function() {});
emitter.on(/foo/, function() {});

PatternEmitter.patternListenerCount(emitter, /foo/); // 1
```

## Events

Like EventEmitter, instances of PatternEmitter emit events both when listeners
are added and removed. The events can be matched by pattern listeners, and as
such will include the name/type as a property, accessible via `this.event`.

#### newListener

The event is emitted any time a new listener is added to the emitter. The event
is emitted just prior to the listener being added, to prevent recursion.

* `*` event | pattern
* `function` listener

``` javascript
emitter.on(/Listener/, function(pattern, listener) {
  // this.event will equal 'newListener' when a new listener is added
});
```

#### removeListener

The event is emitted any time an existing listener is removed from the emitter.
The event is emitted just prior to the listener being removed, to prevent
recursion.

* `*` event | pattern
* `function` listener

``` javascript
emitter.on('removeListener', function(event, listener) {
  // invoked when a listener is removed
});
```

## Performance

**TL;DR:** *Likely not an issue unless you're invoking in excess of 1,000,000
listeners per second*

Despite the ease of replacing EventEmitter throughout your application,
performance should be considered for any event-heavy code. This implementation
was done in an attempt to avoid copying a majority of the source in
`node/lib/events.js`, which resulted in a couple otherwise unnecessary
assignments and function calls when dealing with EventEmitter's default
behaviour.

To illustrate, consider the performance difference between both modules when
only registering to string events, no regular expressions. Running
[benchmarks/eventEmitting.js](https://github.com/danielstjules/pattern-emitter/blob/master/benchmarks/eventEmitting.js):

```
$ node benchmarks/eventEmitting.js
EventEmitter x 208,424 ops/sec ±0.28% (102 runs sampled)
PatternEmitter x 164,004 ops/sec ±0.45% (101 runs sampled)
```

Each operation in the above benchmark is invoking 100 listeners: 10 for each
of 10 different events. That is, 20,842,400 vs 16,400,400 invocations a second
on my Macbook Air. So while a performance drop, it may not be a problem for
your average node instance.

For testing PatternEmitter with its pattern matching behaviour, a second
naive benchmark currently exists. With 100 pattern listeners, 10 for each
of 10 different patterns,
[benchmarks/patternEmitting.js](https://github.com/danielstjules/pattern-emitter/blob/master/benchmarks/patternEmitting.js)
can be used:

```
$ node benchmarks/patternEmitting.js
PatternEmitter x 33,179 ops/sec ±0.26% (101 runs sampled)
```

Still, 3,317,900 invocations a second for simple, small regular expressions.
Of course, your own numbers will vary depending on the complexity of the
patterns.
