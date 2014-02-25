var expect = require('expect.js');
var PatternEmitter = require('../lib/patternEmitter');
var EventEmitter = require('events').EventEmitter;

describe('PatternEmitter', function() {
  var emitter;

  beforeEach(function() {
    emitter = new PatternEmitter();
  });

  it("inherits listeners, once and setMaxListeners from EventEmitter", function() {
    var methods = ['listeners', 'once', 'setMaxListeners'];

    methods.forEach(function(method) {
      expect(PatternEmitter.prototype[method]).to.be(EventEmitter.prototype[method]);
    });
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

      emitter.on(/^t.*/, function() {
        invoked = true;
      });

      emitter.on('invalid', function() {
        invoked = true;
      });

      var result = emitter.emit('noMatch');

      expect(invoked).to.be(false);
      expect(result).to.be(false);
    });

    it('returns true if a listener matches the event', function() {
      emitter.on('test', function() {});
      var result = emitter.emit('test');

      expect(result).to.be(true);
    });

    it('returns true if a pattern listener matches the event', function() {
      emitter.on(/^t.*/, function() {});
      var result = emitter.emit('test');

      expect(result).to.be(true);
    });

    it('invokes a listener when the event matches its type', function() {
      var invoked = false;
      emitter.on('test', function() {
        invoked = true;
      });

      emitter.emit('test');

      expect(invoked).to.be(true);
    });

    it('invokes a listener when the event matches its pattern', function() {
      var invoked = false;
      emitter.on(/^t.*/, function() {
        invoked = true;
      });

      emitter.emit('test');

      expect(invoked).to.be(true);
    });

    it('invokes the listener with any additional arguments', function() {
      var args;
      emitter.on(/^t\w{3}/, function(arg1, arg2, arg3) {
        args = [arg1, arg2, arg3];
      });

      emitter.emit('test', 'arg1', 'arg2', 'arg3');

      expect(args).to.eql(['arg1', 'arg2', 'arg3']);
    });

    it('adds an event property to the invoked listener', function() {
      var event;
      emitter.on(/^\w{2}/, function() {
        event = this.event;
      });

      emitter.emit('test');

      expect(event).to.eql('test');
    });

    it('invokes all matching listeners', function() {
      var x = 0;
      var y = 0;
      var z = 0;

      var listener1 = function() {
        x++;
      };

      var listener2 = function() {
        y++;
      };

      var listener3 = function() {
        z++;
      };

      emitter.on(/t.*/, listener1);

      emitter.on(/.*/, listener1);
      emitter.on(/.*/, listener2);
      emitter.on(/.*/, listener3);

      emitter.on('test', listener3);

      emitter.emit('test');

      expect(x).to.be(2);
      expect(y).to.be(1);
      expect(z).to.be(2);
    });

    it('can be called multiple times', function() {
      var counter = 0;
      emitter.on(/[t]/, function() {
        counter++;
      });

      emitter.emit('test');
      expect(counter).to.be(1);
      emitter.emit('test');
      expect(counter).to.be(2);
    });
  });

  describe('prototype.once', function() {
    it('adds a listener that can be invoked at most once', function() {
      var counter = 0;
      var listener = function() {
        counter++;
      };

      emitter.once(/[a-z]/, listener);
      emitter.emit('test');
      emitter.emit('test');

      expect(counter).to.be(1);
      expect(emitter._patternEvents).not.to.have.key('/[a-z]/');
    });
  });

  describe('prototype.addListener', function() {
    it("throws a TypeError if listener isn't a function", function() {
      var invalidCall = function() {
        emitter.addListener(/test/, 'invalid');
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it("calls _addListener if type isn't a RegExp", function() {
      var invoked = false;
      emitter._addListener = function() {
        invoked = true;
      };

      emitter.addListener('test', function() {});

      expect(invoked).to.be(true);
    });

    it("adds the listener to _events if type isn't a RegExp", function() {
      var listener = function() {};
      emitter.addListener('test', listener);

      expect(emitter._events).to.have.key('test');
      expect(emitter._events['test']).to.be(listener);
    });

    it('adds a pattern listener to the _patternEvents property', function() {
      var regex = /test*/;
      var listener = function() {};
      emitter.addListener(regex, listener);

      expect(emitter._patternEvents).to.have.key(String(regex));
      expect(emitter._patternEvents[String(regex)]).to.be(listener);
    });

    it('creates a regex and adds it to the _regexes property', function() {
      var regex = /test*/;
      emitter.addListener(regex, function() {});

      expect(emitter._regexes).to.have.key(String(regex));
      expect(emitter._regexes[String(regex)]).to.be.a(RegExp);
    });

    it('handles multiple listeners', function() {
      var regex1 = /test1*/;
      var regex2 = /test2*/;

      var listener1 = function() {};
      var listener2 = function() {};

      emitter.addListener(regex1, listener1);
      emitter.addListener(regex2, listener2);

      expect(emitter._patternEvents[String(regex1)]).to.equal(listener1);
      expect(emitter._patternEvents[String(regex2)]).to.equal(listener2);
    });

    it('can add multiple listeners for the same pattern', function() {
      var regex = /test*/;
      emitter.addListener(regex, function() {});
      emitter.addListener(regex, function() {});

      expect(emitter._patternEvents[String(regex)]).to.have.length(2);
    });

    it('returns the instance of PatternEmitter', function() {
      var returned = emitter.addListener(/test*/, function() {});
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
    var regexes = [/pattern1/, /pattern2/];
    var keys = [String(/pattern1/), String(/pattern2/)];

    beforeEach(function() {
      listeners = [];

      regexes.forEach(function(regex) {
        var listener = function() {};
        listeners.push(listener);
        emitter._patternEvents[String(regex)] = listener;
        emitter._regexes[String(regex)] = regex;
      });
    });

    it("throws a TypeError if listener isn't a function", function() {
      var invalidCall = function() {
        emitter.removeListener(/test/, 'invalid');
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it("calls _removeListener if type isn't a RegExp", function() {
      var invoked = false;
      emitter._removeListener = function() {
        invoked = true;
      };

      emitter.removeListener('test', function() {});

      expect(invoked).to.be(true);
    });

    it("removes the listener from _events if type isn't a RegExp", function() {
      var listener = function() {};
      emitter.addListener('test', listener);
      emitter.removeListener('test', listener);

      expect(emitter._events).not.to.have.key('test');
    });

    it("doesn't remove pattern listeners given a string type", function() {
      var key = String(/pattern1/);
      emitter.removeListener(key, listeners[0]);

      expect(emitter._patternEvents).to.have.key(key);
    });

    it('removes the listener from the _patternEvents property', function() {
      emitter.removeListener(regexes[0], listeners[0]);

      expect(emitter._patternEvents).not.to.have.key(keys[0]);
      expect(emitter._patternEvents[keys[1]]).to.be(listeners[1]);
    });

    it("doesn't modify other listeners for the pattern", function() {
      emitter._patternEvents[keys[0]] = [listeners[0], listeners[1]];
      emitter.removeListener(regexes[0], listeners[0]);

      expect(emitter._patternEvents[keys[0]][0]).to.be(listeners[1]);
    });

    it('removes the regex if no other listeners exist for the pattern', function() {
      emitter.removeListener(regexes[0], listeners[0]);

      expect(emitter._regexes).not.to.have.key(regexes[0]);
      expect(emitter._regexes[regexes[1]]).to.be.a(RegExp);
    });

    it("doesn't modify the regex if other listeners exist for the pattern", function() {
      emitter._patternEvents[keys[0]] = [listeners[0], listeners[1]];
      emitter.removeListener(regexes[0], listeners[0]);

      expect(emitter._regexes).to.have.key(keys[0]);
    });

    it('returns the instance of PatternEmitter', function() {
      var returned = emitter.removeListener(keys[0], listeners[0]);

      expect(returned).to.equal(emitter);
    });
  });

  describe('prototype.removeAllListeners', function() {
    var regex = /.*/;

    beforeEach(function() {
      emitter.addListener(regex, function() {});
      emitter.addListener(regex, function() {});
    });

    it('removes all listeners for a given pattern', function() {
      emitter.removeAllListeners(regex);

      expect(emitter._patternEvents).not.to.have.key(String(regex));
    });

    it('deletes the pattern from the _regexes property', function() {
      emitter.removeAllListeners(regex);

      expect(emitter._regexes).not.to.have.key(String(regex));
    });

    it('returns the instance of PatternEmitter', function() {
      var returned = emitter.removeAllListeners(regex);

      expect(returned).to.equal(emitter);
    });
  });

  describe('prototype.patternListeners', function() {
    it("throws a TypeError if pattern isn't a RexExp", function() {
      var invalidCall = function() {
        PatternEmitter.patternListeners(1);
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it('returns all listeners for the given pattern', function() {
      var regex = /.*/;
      emitter.addListener(regex, function() {});
      emitter.addListener(regex, function() {});

      var result = emitter.patternListeners(regex);

      expect(result[0]).to.be(emitter._patternEvents[String(regex)][0]);
      expect(result[1]).to.be(emitter._patternEvents[String(regex)][1]);
    });
  });

  describe('prototype.matchingListeners', function() {
    it('returns an empty array if no listeners match the event', function() {
      var result = emitter.matchingListeners(/nonMatching/);

      expect(result).to.have.length(0);
    });

    it('returns an array with a single listener if only one matches', function() {
      var listener = function() {};
      emitter.addListener(/match/, listener);

      emitter.addListener(/nonMatch/, function() {});

      var result = emitter.matchingListeners('match');

      expect(result).to.have.length(1);
      expect(result).to.eql([listener]);
    });

    it('returns an array with matching listeners across patterns and type', function() {
      var listener1 = function() {};
      var listener2 = function() {};
      var listener3 = function() {};
      var listener4 = function() {};

      var invalidListener1 = function() {};
      var invalidListener2 = function() {};

      emitter.on(new RegExp('test1'), listener1);
      emitter.on(new RegExp('test\\d'), listener2);
      emitter.on(new RegExp('test\\d'), listener3);
      emitter.on('test1', listener4);

      emitter.on(/testing/, invalidListener1);
      emitter.on('test2', invalidListener2);

      var result = emitter.matchingListeners('test1');

      expect(result).to.have.length(4);
      expect(result).to.contain(listener1, listener2, listener3, listener4);
    });
  });

  describe('patternListenerCount', function() {
    it("throws a TypeError if pattern isn't a RegExp", function() {
      var invalidCall = function() {
        PatternEmitter.patternListenerCount(1, function() {});
      };

      expect(invalidCall).to.throwException(function (e) {
        expect(e).to.be.a(TypeError);
      });
    });

    it('returns the number of listeners for the pattern', function() {
      emitter.addListener(/.*/, function() {});
      emitter.addListener(/.*/, function() {});

      var result = PatternEmitter.patternListenerCount(emitter, /.*/);

      expect(result).to.be(2);
    });
  });

  describe('listenerCount', function() {
    it('returns the number of listeners for the event type', function() {
      emitter.addListener('test', function() {});
      emitter.addListener('test', function() {});
      emitter.addListener(/test/, function() {});

      var result = PatternEmitter.listenerCount(emitter, 'test');

      expect(result).to.be(2);
    });
  });

  describe('matchingListenerCount', function() {
    it('returns the number of matching listeners for the type', function() {
      emitter.addListener(/.*/, function() {});
      emitter.addListener(/\w/, function() {});
      emitter.addListener(/\w/, function() {});
      emitter.addListener(/z/, function() {});

      var result = PatternEmitter.matchingListenerCount(emitter, 'test');

      expect(result).to.be(3);
    });
  });
});
