var Hand  = require('./hand'),
    Stack = require('./stack').Stack;

exports.Player = function(name) {
  this.name = name;

  this.points = new Stack();
}
