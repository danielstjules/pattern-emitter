pattern-emitter
===============

Event emitters with support for regular expressions. Inherits from Node's
EventEmitter.

[![Build Status](https://travis-ci.org/danielstjules/pattern-emitter.png)](https://travis-ci.org/danielstjules/pattern-emitter)

* [Installation](#installation)
* [Overview](#overview)

## Installation

Using npm, you can install pattern-emitter with `npm install pattern-emitter`.
You can also require it as a dependency in your `package.json` file:

```
"dependencies": {
    "pattern-emitter": ">0.0.0"
}
```

## Overview

The PatternEmitter class both extends and is 100% backwards compatible with
EventEmitter. It simply exposes a new set of methods on top of the existing
API for registering listeners to events matching patterns. As a result, using
this library is as simple as replacing instances of:

```
var Emitter = require('events').EventEmitter; // Node 0.10.x
var Emitter = require('events');              // Node 0.12.x
```

with:

```
var Emitter = require('pattern-emitter');
```
