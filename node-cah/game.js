var Round   = require('./round').Round,
    Deck    = require('./deck').Deck,
    Player  = require('./player').Player,
    Hand    = require('./hand').Hand,

    events  = require('events'),
    util    = require('util');

exports.Game = function(deckFile) {
  events.EventEmitter.call(this);

  var game = this;
  this.deck = new Deck();
  this.deck.loadFile(deckFile || 'deck.json');
  this.deck.on('shuffle', function(stack) {
    if (this.unshuffled.length == 0) {
      this.removeAllListeners('shuffle');
      game.emit2('deckReady');
    }
  });

  this.players = [];

  this.on('refillHands', function() {
    this.players.forEach(function(player) {
      player.hand.refill();

      if (player.needsCards && player.hand.length == 10) {
        game.emit2('handReady', player);
        player.needsCards = false;
      }
    });
  });

  this.on('playerLeft', function(player) {
    if (!this.round) { return; }

    var stillHere = this.players;
    this.round.waitingOn = this.round.waitingOn.filter(function(loser) {
      return stillHere.indexOf(loser) != -1;
    });
  });
}
util.inherits(exports.Game, events.EventEmitter);

exports.Game.prototype.startGame = function() {
  this.rounds = [];
  this.nextLeader = this.players[this.players.length - 1];

  this.emit2('gameStart');
  this.startRound();
}

exports.Game.prototype.startRound = function() {
  var i = this.players.indexOf(this.nextLeader) + 1;
  if (i >= this.players.length) { i = 0; }
  this.nextLeader = this.players[i];

  this.round = new Round(this);
  this.rounds.push(this.round);
}

exports.Game.prototype.addPlayer = function(name) {
  var player = new Player(name);
  player.game = this;
  player.hand = new Hand(this.deck);
  this.players.push(player);

  this.emit2('newPlayer', player);

  if (this.round && this.round.picking) {
    this.round.waitingOn.push(player);
    player.needsCards = true;
  }

  return player;
}

exports.Game.prototype.emit2 = function(name, data) {
  console.log('Emitting ' + name + ' with:', data);
  this.emit('emit', {name: name, data: data});
  this.emit(name, data);
}