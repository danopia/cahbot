var random = require('./../node-random');

exports.Round = function(game) {
  this.game = game;

  this.judge = this.game.nextLeader;
  this.blackCard = this.game.deck.black.shift();
  this.choices = [];

  this.picking = true;

  var judge = this.judge;
  this.waitingOn = this.game.players.filter(function(loser) {
    return loser != judge;
  });

  this.game.emit2('roundStart', this);
  this.game.emit2('pickingStart', this);
}

exports.Round.prototype.pickSet = function(player, set) {
  if (!this.picking) { return; }
  if (this.judge == player) { return; }
  if (this.waitingOn.indexOf(player) == -1) { return; }

  this.choices.push([player, set]);
  this.waitingOn = this.waitingOn.filter(function(loser) {
    return player != loser;
  });

  player.hand = player.hand.removeAll(set);

  this.game.emit2('pick', [this, player, set]);

  if (this.waitingOn.length == 0) {
    this.startJudging();
  }
}

exports.Round.prototype.startJudging = function() {
  if (!this.picking) { return; }
  this.picking = false;
  this.judging = true;

  this.game.emit2('pickingEnd', this);
  this.game.emit2('refillHands');

  var round = this;
  random.shuffle(this.choices, function(err, choices) {
    round.choices = choices;
    round.game.emit2('judgingStart', [round, round.choices.map(function(a) {return a[1];})]);
  });
}

exports.Round.prototype.pickWinner = function(index) {
  if (this.winner) { return; }
  this.judging = false;

  console.log(this.choices, index);

  this.winner = this.choices[index];
  this.winner[0].points.push(this.blackCard);

  this.game.deck.grave.pushAll(this.choices.map(function(a) {return a[1];}));

  this.game.emit2('judgingEnd', this);
  this.game.emit2('addPoint', this.winner[0]);
  this.game.emit2('roundEnd', this);

  this.game.startRound();
}