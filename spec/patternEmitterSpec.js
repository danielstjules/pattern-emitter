var expect = require('expect.js');
var PatternEmitter = require('../lib/patternEmitter');

describe('PatternEmitter', function() {
  var emitter;

  beforeEach(function() {
    emitter = new PatternEmitter();
  });

  it("inherits EventEmitter's prototype as private methods", function() {
    var methods = ['_addListener', '_removeListener', 'removeAllListeners',
      '_listeners', '_once'];

    methods.forEach(function(method) {
      expect(emitter[method]).to.be.a('function');
    });
  });

  describe('constructor', function() {
    it('adds an _events property', function() {
      expect(emitter._events).to.eql({});
    });

    it('adds a _regexes property', function() {
      expect(emitter._regexes).to.eql({});
    });
  });

  describe('prototype.emit', function() {
    it("throws a TypeError if type isn't a string", function() {
      var invalidCall = function() {
        emitter.emit(1, 'test');
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it('returns false if no listeners match the event', function() {
      var invoked = false;
      emitter._events['^t.*'] = function() {
        invoked = true;
      };
      emitter._regexes['^t.*'] = new RegExp('^t.*');
      var result = emitter.emit('noMatch');

      expect(invoked).to.be(false);
      expect(result).to.be(false);
    });

    it('invokes a listener when the event matches its pattern', function() {
      var invoked = false;
      emitter._events['^t.*'] = function() {
        invoked = true;
      };
      emitter._regexes['^t.*'] = new RegExp('^t.*');
      emitter.emit('test');

      expect(invoked).to.be(true);
    });

    it('invokes the listener with any additional arguments', function() {
      var args;
      emitter._events['^t\\w{3}'] = function(arg1, arg2, arg3) {
        args = [arg1, arg2, arg3];
      };
      emitter._regexes['^t\\w{3}'] = new RegExp('^t\\w{3}');
      emitter.emit('test', 'arg1', 'arg2', 'arg3');

      expect(args).to.eql(['arg1', 'arg2', 'arg3']);
    });

    it('adds an event property to the invoked listener', function() {
      var event;
      emitter._events['^\\w{2}'] = function() {
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

      emitter._events['^t.*'] = listener1;
      emitter._regexes['^t.*'] = new RegExp('^t.*');

      emitter._events['.*'] = [listener1, listener2];
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

      emitter._events['[t]'] = listener;
      emitter._regexes['[t]'] = new RegExp('[t]');

      emitter.emit('test');
      expect(counter).to.be(1);
      emitter.emit('test');
      expect(counter).to.be(2);
    });
  });

  describe('prototype.once', function() {
    it("throws a TypeError if pattern isn't a string", function() {
      var invalidCall = function() {
        emitter.once(1, function() {});
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

      emitter.once('[a-z]', listener);
      emitter.emit('test');
      emitter.emit('test');

      expect(counter).to.be(1);
      expect(emitter._events).not.to.have.key('[a-z]');
    });
  });

  describe('prototype.addListener', function() {
    it("throws a TypeError if pattern isn't a string", function() {
      var invalidCall = function() {
        emitter.addListener(1, function() {});
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it("throws a TypeError if listener isn't a function", function() {
      var invalidCall = function() {
        emitter.addListener('test', 'invalid');
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it('adds the listener to the _events property', function() {
      var listener = function() {};
      emitter.addListener('test*', listener);

      expect(emitter._events).to.have.key('test*');
      expect(emitter._events['test*']).to.be(listener);
    });

    it('creates a regex and adds it to the _regexes property', function() {
      var pattern = 'test*';
      emitter.addListener(pattern, function() {});

      expect(emitter._regexes).to.have.key(pattern);
      expect(emitter._regexes[pattern]).to.be.a(RegExp);
    });

    it('handles multiple listeners', function() {
      var pattern1 = 'test1*';
      var pattern2 = 'test2*';

      var listener1 = function() {};
      var listener2 = function() {};

      emitter.addListener(pattern1, listener1);
      emitter.addListener(pattern2, listener2);

      expect(emitter._events[pattern1]).to.equal(listener1);
      expect(emitter._events[pattern2]).to.equal(listener2);
    });

    it('can add multiple listeners for the same pattern', function() {
      var pattern = 'test*';
      emitter.addListener(pattern, function() {});
      emitter.addListener(pattern, function() {});

      expect(emitter._events[pattern]).to.have.length(2);
    });

    it('returns the instance of PatternEmitter', function() {
      var returned = emitter.addListener('test*', function() {});
      expect(returned).to.equal(emitter);
    });
  });

  describe('prototype.on', function() {
    it('is an alias for prototype.addListener', function() {
      expect(emitter.on).to.equal(emitter.addListener);
    });
  });

  describe('prototype.removeListener', function() {
    var listeners;
    var patterns = ['pattern1', 'pattern2'];

    beforeEach(function() {
      listeners = [];

      patterns.forEach(function(pattern) {
        var listener = function() {};
        listeners.push(listener);
        emitter._events[pattern] = listener;
        emitter._regexes[pattern] = new RegExp(pattern);
      });
    });

    it("throws a TypeError if pattern isn't a string", function() {
      var invalidCall = function() {
        emitter.removeListener(1, function() {});
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it("throws a TypeError if listener isn't a function", function() {
      var invalidCall = function() {
        emitter.removeListener('test', 'invalid');
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it('removes the listener from the _events property', function() {
      emitter.removeListener(patterns[0], listeners[0]);

      expect(emitter._events).not.to.have.key(patterns[0]);
      expect(emitter._events[patterns[1]]).to.be(listeners[1]);
    });

    it("doesn't modify other listeners for the pattern", function() {
      emitter._events[patterns[0]] = [listeners[0], listeners[1]];
      emitter.removeListener(patterns[0], listeners[0]);

      expect(emitter._events[patterns[0]][0]).to.be(listeners[1]);
    });

    it('removes the regex if no other listeners exist for the pattern', function() {
      emitter.removeListener(patterns[0], listeners[0]);

      expect(emitter._regexes).not.to.have.key(patterns[0]);
      expect(emitter._regexes[patterns[1]]).to.be.a(RegExp);
    });

    it("doesn't modify the regex if other listeners exist for the pattern", function() {
      emitter._events[patterns[0]] = [listeners[0], listeners[1]];
      emitter.removeListener(patterns[0], listeners[0]);

      expect(emitter._regexes).to.have.key(patterns[0]);
    });

    it('returns the instance of PatternEmitter', function() {
      var returned = emitter.removeListener(patterns[0], listeners[0]);

      expect(returned).to.equal(emitter);
    });
  });

  describe('prototype.removeAllListeners', function() {
    beforeEach(function() {
      emitter._events['.*'] = [function() {}, function() {}];
      emitter._regexes['.*'] = new RegExp('.*');
    });

    it('removes all listeners for a given pattern', function() {
      emitter.removeAllListeners('.*');

      expect(emitter._events).not.to.have.key('.*');
    });

    it('deletes the pattern from the _regexes property', function() {
      emitter.removeAllListeners('.*');

      expect(emitter._regexes).not.to.have.key('.*');
    });

    it('returns the instance of PatternEmitter', function() {
      var returned = emitter.removeAllListeners('.*');

      expect(returned).to.equal(emitter);
    });
  });

  describe('prototype.listeners', function() {
    it("throws a TypeError if pattern isn't a string", function() {
      var invalidCall = function() {
        emitter.listeners(1);
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it('returns all listeners for the given pattern', function() {
      emitter._events['.*'] = [function() {}, function() {}];
      var result = emitter.listeners('.*');

      expect(result[0]).to.be(emitter._events['.*'][0]);
      expect(result[1]).to.be(emitter._events['.*'][1]);
    });
  });

  describe('prototype.matchingListeners', function() {
    it("throws a TypeError if type isn't a string", function() {
      var invalidCall = function() {
        emitter.matchingListeners(1);
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it('returns an empty array if no listeners match the event', function() {
      var result = emitter.matchingListeners('nonMatching');

      expect(result).to.have.length(0);
    });

    it('returns an array with a single listener if only one matches', function() {
      var listener = function() {};
      emitter._events['match'] = listener;
      emitter._regexes['match'] = new RegExp('match');

      emitter._events['nonMatch'] = listener;
      emitter._regexes['nonMatch'] = new RegExp('nonMatch');

      var result = emitter.matchingListeners('match');

      expect(result).to.have.length(1);
      expect(result).to.eql([listener]);
    });

    it('returns an array with matching listeners across patterns', function() {
      var listener1 = function() {};
      var listener2 = function() {};
      var listener3 = function() {};

      emitter._events['test1'] = listener1;
      emitter._regexes['test1'] = new RegExp('test1');

      emitter._events['test\\d'] = [listener2, listener3];
      emitter._regexes['test\\d'] = new RegExp('test\\d');

      var result = emitter.matchingListeners('test1');

      expect(result).to.have.length(3);
      expect(result).to.eql([listener1, listener2, listener3]);
    });
  });

  describe('listenerCount', function() {
    it("throws a TypeError if pattern isn't a string", function() {
      var invalidCall = function() {
        PatternEmitter.listenerCount(1, function() {});
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it('returns the number of listeners for the pattern', function() {
      emitter._events['.*'] = [function() {}, function() {}];
      var result = PatternEmitter.listenerCount(emitter, '.*');

      expect(result).to.be(2);
    });
  });
});
