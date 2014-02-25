/**
 * A naive benchmark testing the performance hit when only using
 * events, thus defaulting to regular EventEmitter behaviour.
 */

var Benchmark      = require('benchmark');
var EventEmitter   = require('events').EventEmitter;
var PatternEmitter = require('../lib/patternEmitter');

var suite          = new Benchmark.Suite();
var eventEmitter   = new EventEmitter();
var patternEmitter = new PatternEmitter();

var i, j;

// Setup both emitters with 10 listeners on each of 10 events

for (i = 0; i < 10; i++) {
  for (j = 0; j < 10; j++) {
    eventEmitter.on('event:' + i, function() {
      // Do nothing
    });
  }
}

for (i = 0; i < 10; i++) {
  for (j = 0; j < 10; j++) {
    patternEmitter.on('event:' + i, function() {
      // Do nothing
    });
  }
}

suite.add('EventEmitter', function() {
  for (i = 0; i < 10; i++) {
    eventEmitter.emit('event:' + i);
  }
})
.add('PatternEmitter', function() {
  for (i = 0; i < 10; i++) {
    patternEmitter.emit('event:' + i);
  }
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.run();
