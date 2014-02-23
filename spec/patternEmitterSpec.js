var expect = require('expect.js');
var PatternEmitter = require('../lib/patternEmitter');
var EventEmitter = require('events').EventEmitter;

describe('PatternEmitter', function() {
  var emitter;

  beforeEach(function() {
    emitter = new PatternEmitter();
  });

  it("inherits EventEmitter's prototype", function() {
    var methods = ['addListener', 'removeListener', 'removeAllListeners',
      'listeners', 'once', 'setMaxListeners'];

    methods.forEach(function(method) {
      expect(PatternEmitter.prototype[method]).to.be(EventEmitter.prototype[method]);
    });
  });

  it('keeps EventEmitter.prototype.emit as a private method', function() {
    expect(PatternEmitter.prototype._emit).to.be(EventEmitter.prototype.emit);
  });

  describe('constructor', function() {
    it('adds an _events property', function() {
      expect(emitter._events).to.eql({});
    });

    it('adds a _patternEvents property', function() {
      expect(emitter._patternEvents).to.eql({});
    });

    it('adds a _regexes property', function() {
      expect(emitter._regexes).to.eql({});
    });
  });

  describe('prototype.emit', function() {
    it('returns false if no listeners match the event', function() {
      var invoked = false;
      emitter._patternEvents['^t.*'] = function() {
        invoked = true;
      };
      emitter._regexes['^t.*'] = new RegExp('^t.*');
      var result = emitter.emit('noMatch');

      expect(invoked).to.be(false);
      expect(result).to.be(false);
    });

    it('invokes a listener when the event matches its pattern', function() {
      var invoked = false;
      emitter._patternEvents['^t.*'] = function() {
        invoked = true;
      };
      emitter._regexes['^t.*'] = new RegExp('^t.*');
      emitter.emit('test');

      expect(invoked).to.be(true);
    });

    it('invokes the listener with any additional arguments', function() {
      var args;
      emitter._patternEvents['^t\\w{3}'] = function(arg1, arg2, arg3) {
        args = [arg1, arg2, arg3];
      };
      emitter._regexes['^t\\w{3}'] = new RegExp('^t\\w{3}');
      emitter.emit('test', 'arg1', 'arg2', 'arg3');

      expect(args).to.eql(['arg1', 'arg2', 'arg3']);
    });

    it('adds an event property to the invoked listener', function() {
      var event;
      emitter._patternEvents['^\\w{2}'] = function() {
        event = this.event;
      };
      emitter._regexes['^\\w{2}'] = new RegExp('^\\w{2}');
      emitter.emit('test');

      expect(event).to.eql('test');
    });

    it('invokes all matching listeners', function() {
      var x = 0;
      var y = 0;

      var listener1 = function() {
        x++;
      };

      var listener2 = function() {
        y++;
      };

      emitter._patternEvents['^t.*'] = listener1;
      emitter._regexes['^t.*'] = new RegExp('^t.*');

      emitter._patternEvents['.*'] = [listener1, listener2];
      emitter._regexes['.*'] = new RegExp('.*');

      emitter.emit('test');

      expect(x).to.be(2);
      expect(y).to.be(1);
    });

    it('can be called multiple times', function() {
      var counter = 0;
      var listener = function() {
        counter++;
      };

      emitter._patternEvents['[t]'] = listener;
      emitter._regexes['[t]'] = new RegExp('[t]');

      emitter.emit('test');
      expect(counter).to.be(1);
      emitter.emit('test');
      expect(counter).to.be(2);
    });
  });

  describe('prototype.onceOnPattern', function() {
    it("throws a TypeError if pattern isn't a string", function() {
      var invalidCall = function() {
        emitter.onceOnPattern(1, function() {});
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it('adds a listener that can be invoked at most once', function() {
      var counter = 0;
      var listener = function() {
        counter++;
      };

      emitter.onceOnPattern('[a-z]', listener);
      emitter.emit('test');
      emitter.emit('test');

      expect(counter).to.be(1);
      expect(emitter._patternEvents).not.to.have.key('[a-z]');
    });
  });

  describe('prototype.addPatternListener', function() {
    it("throws a TypeError if pattern isn't a string", function() {
      var invalidCall = function() {
        emitter.addPatternListener(1, function() {});
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it("throws a TypeError if listener isn't a function", function() {
      var invalidCall = function() {
        emitter.addPatternListener('test', 'invalid');
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it('adds the listener to the _patternEvents property', function() {
      var listener = function() {};
      emitter.addPatternListener('test*', listener);

      expect(emitter._patternEvents).to.have.key('test*');
      expect(emitter._patternEvents['test*']).to.be(listener);
    });

    it('creates a regex and adds it to the _regexes property', function() {
      var pattern = 'test*';
      emitter.addPatternListener(pattern, function() {});

      expect(emitter._regexes).to.have.key(pattern);
      expect(emitter._regexes[pattern]).to.be.a(RegExp);
    });

    it('handles multiple listeners', function() {
      var pattern1 = 'test1*';
      var pattern2 = 'test2*';

      var listener1 = function() {};
      var listener2 = function() {};

      emitter.addPatternListener(pattern1, listener1);
      emitter.addPatternListener(pattern2, listener2);

      expect(emitter._patternEvents[pattern1]).to.equal(listener1);
      expect(emitter._patternEvents[pattern2]).to.equal(listener2);
    });

    it('can add multiple listeners for the same pattern', function() {
      var pattern = 'test*';
      emitter.addPatternListener(pattern, function() {});
      emitter.addPatternListener(pattern, function() {});

      expect(emitter._patternEvents[pattern]).to.have.length(2);
    });

    it('returns the instance of PatternEmitter', function() {
      var returned = emitter.addPatternListener('test*', function() {});
      expect(returned).to.equal(emitter);
    });
  });

  describe('prototype.on', function() {
    it('is an alias for prototype.addListener', function() {
      expect(emitter.onPattern).to.equal(emitter.addPatternListener);
    });
  });

  describe('prototype.removePatternListener', function() {
    var listeners;
    var patterns = ['pattern1', 'pattern2'];

    beforeEach(function() {
      listeners = [];

      patterns.forEach(function(pattern) {
        var listener = function() {};
        listeners.push(listener);
        emitter._patternEvents[pattern] = listener;
        emitter._regexes[pattern] = new RegExp(pattern);
      });
    });

    it("throws a TypeError if pattern isn't a string", function() {
      var invalidCall = function() {
        emitter.removePatternListener(1, function() {});
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it("throws a TypeError if listener isn't a function", function() {
      var invalidCall = function() {
        emitter.removePatternListener('test', 'invalid');
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it('removes the listener from the _patternEvents property', function() {
      emitter.removePatternListener(patterns[0], listeners[0]);

      expect(emitter._patternEvents).not.to.have.key(patterns[0]);
      expect(emitter._patternEvents[patterns[1]]).to.be(listeners[1]);
    });

    it("doesn't modify other listeners for the pattern", function() {
      emitter._patternEvents[patterns[0]] = [listeners[0], listeners[1]];
      emitter.removePatternListener(patterns[0], listeners[0]);

      expect(emitter._patternEvents[patterns[0]][0]).to.be(listeners[1]);
    });

    it('removes the regex if no other listeners exist for the pattern', function() {
      emitter.removePatternListener(patterns[0], listeners[0]);

      expect(emitter._regexes).not.to.have.key(patterns[0]);
      expect(emitter._regexes[patterns[1]]).to.be.a(RegExp);
    });

    it("doesn't modify the regex if other listeners exist for the pattern", function() {
      emitter._patternEvents[patterns[0]] = [listeners[0], listeners[1]];
      emitter.removePatternListener(patterns[0], listeners[0]);

      expect(emitter._regexes).to.have.key(patterns[0]);
    });

    it('returns the instance of PatternEmitter', function() {
      var returned = emitter.removePatternListener(patterns[0], listeners[0]);

      expect(returned).to.equal(emitter);
    });
  });

  describe('prototype.removeAllPatternListeners', function() {
    beforeEach(function() {
      emitter._patternEvents['.*'] = [function() {}, function() {}];
      emitter._regexes['.*'] = new RegExp('.*');
    });

    it('removes all listeners for a given pattern', function() {
      emitter.removeAllPatternListeners('.*');

      expect(emitter._patternEvents).not.to.have.key('.*');
    });

    it('deletes the pattern from the _regexes property', function() {
      emitter.removeAllPatternListeners('.*');

      expect(emitter._regexes).not.to.have.key('.*');
    });

    it('returns the instance of PatternEmitter', function() {
      var returned = emitter.removeAllPatternListeners('.*');

      expect(returned).to.equal(emitter);
    });
  });

  describe('prototype.patternListeners', function() {
    it("throws a TypeError if pattern isn't a string", function() {
      var invalidCall = function() {
        emitter.patternListeners(1);
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it('returns all listeners for the given pattern', function() {
      emitter._patternEvents['.*'] = [function() {}, function() {}];
      var result = emitter.patternListeners('.*');

      expect(result[0]).to.be(emitter._patternEvents['.*'][0]);
      expect(result[1]).to.be(emitter._patternEvents['.*'][1]);
    });
  });

  describe('prototype.matchingListeners', function() {
    it('returns an empty array if no listeners match the event', function() {
      var result = emitter.matchingListeners('nonMatching');

      expect(result).to.have.length(0);
    });

    it('returns an array with a single listener if only one matches', function() {
      var listener = function() {};
      emitter._patternEvents['match'] = listener;
      emitter._regexes['match'] = new RegExp('match');

      emitter._patternEvents['nonMatch'] = listener;
      emitter._regexes['nonMatch'] = new RegExp('nonMatch');

      var result = emitter.matchingListeners('match');

      expect(result).to.have.length(1);
      expect(result).to.eql([listener]);
    });

    it('returns an array with matching listeners across patterns', function() {
      var listener1 = function() {};
      var listener2 = function() {};
      var listener3 = function() {};

      emitter._patternEvents['test1'] = listener1;
      emitter._regexes['test1'] = new RegExp('test1');

      emitter._patternEvents['test\\d'] = [listener2, listener3];
      emitter._regexes['test\\d'] = new RegExp('test\\d');

      var result = emitter.matchingListeners('test1');

      expect(result).to.have.length(3);
      expect(result).to.eql([listener1, listener2, listener3]);
    });
  });

  describe('patternListenerCount', function() {
    it("throws a TypeError if pattern isn't a string", function() {
      var invalidCall = function() {
        PatternEmitter.patternListenerCount(1, function() {});
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it('returns the number of listeners for the pattern', function() {
      emitter._patternEvents['.*'] = [function() {}, function() {}];
      var result = PatternEmitter.patternListenerCount(emitter, '.*');

      expect(result).to.be(2);
    });
  });

  describe('matchingListenerCount', function() {
    it("throws a TypeError if type isn't a string", function() {
      var invalidCall = function() {
        PatternEmitter.matchingListenerCount(1, function() {});
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it('returns the number of matching listeners for the type', function() {
      emitter.addPatternListener('.*', function() {});
      emitter.addPatternListener('\\w', function() {});
      emitter.addPatternListener('\\w', function() {});
      emitter.addPatternListener('z', function() {});

      var result = PatternEmitter.matchingListenerCount(emitter, 'test');

      expect(result).to.be(3);
    });
  });
});
