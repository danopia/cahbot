var util   = require('util'),

    Stack  = require('./stack').Stack;

exports.Hand = function(deck, array) {
  Stack.call(this);

  this.deck = deck;
  if (array) {
    this.pushAll(array);
  }

  this.refill();
}
util.inherits(exports.Hand, Stack);

exports.Hand.size = 10;

exports.Hand.prototype.refill = function() {
  while (this.length < exports.Hand.size && this.deck.ready('white')) {
    this.push(this.deck.takeCard('white'));
  }

  if (this.length < exports.Hand.size) {
    var hand = this;
    this.deck.once('shuffleWhite', function() {
      hand.refill();
    });
  }
}

exports.Hand.prototype.remove = function(card) {
  return this.removeAll([card]);
}

exports.Hand.prototype.removeAll = function(cards) {
  return new exports.Hand(this.deck, this.filter(function(loser) {
    return cards.indexOf(loser) == -1;
  }));
}
