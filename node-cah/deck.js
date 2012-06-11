var events  = require('events'),
    util    = require('util'),
    fs      = require('fs'),

    Stack   = require('./stack').Stack,
    random  = require('./../node-random');

exports.Deck = function() {
  events.EventEmitter.call(this);

  this.black = new Stack();
  this.white = new Stack();
  this.grave = new Stack();

  this.unshuffled = [];
}
util.inherits(exports.Deck, events.EventEmitter);

exports.Deck.prototype.loadFile = function(filename, callback) {
  var deck = this;

  fs.readFile(filename, function(err, data) {
    var json = JSON.parse(data);
    deck.black = new Stack(json.black);
    deck.white = new Stack(json.white);
    deck.grave = new Stack();

    deck.emit('load');

    deck.shuffle('black');
    deck.shuffle('white');
  });
}

exports.Deck.prototype.ready = function(stack) {
  return this[stack].length > 0 && this.unshuffled.indexOf(stack) == -1;
}

exports.Deck.prototype.shuffle = function(stack) {
  var deck = this;
  deck.unshuffled.push(stack);

  random.shuffle(deck[stack], function(err, cards) {
    deck[stack] = new Stack(cards);

    deck.unshuffled = deck.unshuffled.filter(function(loser) {
      return loser != stack;
    });

    deck.emit('shuffle', stack);
    deck.emit('shuffle' + stack[0].toUpperCase() + stack.substring(1));
  });
}

exports.Deck.prototype.takeCard = function(stack) {
  if (this[stack].length == 0) { return null; }

  var card = this[stack].shift();

  if (this[stack].length == 0) {
    this.emit('stackEmpty', stack);

    if (stack == 'white' && this.grave.length > 0) {
      this.white = this.grave;
      this.grave = new Stack();
      this.shuffle('white');
    }
  }

  return card;
}
