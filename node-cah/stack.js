var util   = require('util');

exports.Stack = function(cards) {
  Array.call(this);

  if (cards) { this.pushAll(cards); }
}
util.inherits(exports.Stack, Array);

exports.Stack.prototype.pushAll = function(cards) {
  var stack = this;
  cards.forEach(function(card) {
    stack.push(card);
  });
}

exports.Stack.prototype.remove = function(card) {
  return this.removeAll([card]);
}

exports.Stack.prototype.removeAll = function(cards) {
  return new exports.Stack(this.filter(function(loser) {
    return cards.indexOf(loser) == -1;
  }));
}
