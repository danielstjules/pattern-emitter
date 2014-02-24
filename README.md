pattern-emitter
===============

Event emitters with support for regular expressions. Inherits from Node's
EventEmitter.

[![Build Status](https://travis-ci.org/danielstjules/pattern-emitter.png)](https://travis-ci.org/danielstjules/pattern-emitter)

* [Installation](#installation)
* [Overview](#overview)
* [Compatibility](#compatibility)

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
on those patterns and their listeners. As a result, using this library is as
simple as replacing instances of:

```
var Emitter = require('events').EventEmitter; // Node 0.10.x
var Emitter = require('events');              // Node 0.12.x
```

with:

```
var Emitter = require('pattern-emitter');
```

## Compatibility

The use of PatternEmitter is backwards compatible with EventEmitter for all
who haven't been registering listeners to instances of `RegExp`. I suspect
that this covers a great majority of event use.
