/**
 * A naive benchmark testing the performance of listening to patterns
 * with PatternEmitter.
 */

var Benchmark      = require('benchmark');
var PatternEmitter = require('../lib/patternEmitter');

var suite          = new Benchmark.Suite();
var patternEmitter = new PatternEmitter();

var i, j;

// Setup emitter with 10 listeners on each of 10 patterns

for (i = 0; i < 10; i++) {
  for (j = 0; j < 10; j++) {
    patternEmitter.on(new RegExp(':' + i + '$'), function() {
      // Do nothing
    });
  }
}

suite.add('PatternEmitter', function() {
  for (i = 0; i < 10; i++) {
    patternEmitter.emit('event:' + i);
  }
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.run();
