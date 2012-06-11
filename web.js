var express = require('express'),
    io      = require('socket.io'),

    Stack   = require('./node-cah/stack').Stack;

exports.Server = function(game) {
  this.app = express.createServer();
  this.io  = io.listen(this.app);
  this.sockets = [];

  if (game) { this.setGame(game) };

  this.app.listen(4200);

  this.app.get('/', function (req, res) {
    res.sendfile('webroot/index.html');
  });
  this.app.get('/*', function (req, res) {
    res.sendfile('webroot/' + req.params[0]);
  });

  var web = this;
  var player;

  this.io.sockets.on('connection', function (socket) {
    web.sockets.push(socket);

    web.game.players.forEach(function(player) {
      socket.emit('addPlayer', player.name);
    });

    socket.on('join', function (data) {
      if (this.player) { return; }
      this.player = web.game.addPlayer(data);
    });

    socket.on('start', function () {
      if (!this.player || web.game.round) { return; }
      web.game.startGame();
    });

    socket.on('pick', function (data) {
      if (!this.player || !web.game.round) { return; }
      var p = this.player;
      if (web.game.round.picking && web.game.round.judge != this.player) {
        if (data.every(function(x){return p.hand[x] })) {
          var stack = new Stack();
          for (var i in data) {
            stack.push(p.hand[data[i]]);
          }
          web.game.round.pickSet(p, stack);
        }
      } else if (web.game.round.judging && web.game.round.judge == this.player) {
        if (web.game.round.choices[data[0]]) {
          web.game.round.pickWinner(data[0]);
        }
      }
    });
  });
}

exports.Server.prototype.setGame = function(game) {
  this.game = game;
  var io = this.io;
  var web = this;

  this.sockets.forEach(function(socket) {
    socket.player = null;
  });

  game.on('newPlayer', function(e) {
    io.sockets.emit('newPlayer', e.name);
  });

  game.on('gameStart', function(e) {
    io.sockets.emit('gameStart');
  });

  game.on('roundStart', function(e) {
    io.sockets.emit('roundStart', [e.judge.name, e.blackCard]);
  });

  game.on('pickingStart', function(e) {
    io.sockets.emit('pickingStart');

    console.log(web.sockets, e.waitingOn);
    web.sockets.forEach(function(socket) {
      console.log(socket.player);
      if (e.waitingOn.indexOf(socket.player) != -1) {
        console.log('sending', socket.player.hand);
        socket.emit('handReady', socket.player.hand);
      }
    });
  });

  game.on('handReady', function(e) {
    web.sockets.forEach(function(socket) {
      if (e == socket.player) {
        socket.emit('handReady', socket.player.hand);
      }
    });
  });

  game.on('pick', function(e) {
    web.sockets.forEach(function(socket) {
      if (e[1] == socket.player) {
        socket.emit('pick', e[2]);
      }
    });
  });

  game.on('pickingEnd', function(e) {
    io.sockets.emit('pickingEnd');
  });

  game.on('judgingStart', function(e) {
    io.sockets.emit('judgingStart', e[1]);
  });

  game.on('judgingEnd', function(e) {
    io.sockets.emit('judgingEnd', [e.winner[0].name, e.winner[1]]);
  });

  game.on('addPoint', function(e) {
    io.sockets.emit('addPoint', [e.name, e.points]);
  });
}