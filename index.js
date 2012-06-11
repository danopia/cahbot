var Client = require('./node-irc').Client,
    CAH    = require('./node-cah'),
    Server = require('./web').Server;

var admin  = 'danotop',
    nick   = '[CaH]',
    chan   = '##cah', // cardsagainsthumanity
    server = 'irc.freenode.net';

var client = new Client(nick);
var server = client.connect(server);

var players = {},
    game,
    web     = new Server();

//game.on('emit', function(e) {
//  server.message(chan, 'Emitting ' + e.name);
//});

function parseCard(blackCard, whiteCards) {
  var parts = blackCard.split('_');

  if (!whiteCards) {
    whiteCards = [];
    for (var i = 0; i < parts.length - 1; i++) {
      whiteCards[i] = '__BLANK__';
    }
  }

  return [parts[0], whiteCards[0], parts[1], whiteCards[1], parts[2], whiteCards[2], parts[3]].join('');
}

function newGame() {
  players = {};
  game = new CAH.Game();
  web.setGame(game);

  game.on('newPlayer', function(e) {
    server.message(chan, 'Joining the game: ' + e.name);
  });

  game.on('gameStart', function(e) {
    server.message(chan, 'The game is starting!');
  });

  game.on('roundStart', function(e) {
    var card = parseCard(e.blackCard);
    server.message(chan, '' + e.judge.name + ' will be judging this round\'s black card: ' + card); //  invert
  });

  game.on('pickingStart', function(e) {
    e.waitingOn.forEach(function(player) {
      var hand = [];
      for (var i in player.hand) {
        if (i.length == 1) {
          hand.push('15' + (Number(i) + 1) + ') ' + player.hand[i]);
        }
      }

      server.notice(player.name, 'Your hand: ' + hand.join(' || '));
    });

    server.message(chan, 'To pick your card, say "`p <number>" in this channel without the quotes and angle brackets. ' + e.judge.name + ': hang in tight');
  });

  game.on('handReady', function(e) {
    var hand = [];
    for (var i in e.hand) {
      if (i.length == 1) {
        hand.push('15' + (Number(i) + 1) + ') ' + e.hand[i]);
      }
    }

    server.notice(e.name, 'Your hand: ' + hand.join(' || '));
  });

  game.on('pick', function(e) {
    server.notice(e[1].name, 'You picked: ' + parseCard(e[0].blackCard, e[2]));
  });

  game.on('pickingEnd', function(e) {
    server.message(chan, 'All picks are in.');
  });

  game.on('judgingStart', function(e) {
    server.message(chan, 'Here are the ' + e[1].length + ' options that ' + e[0].judge.name + ' has to pick from. ' + e[0].judge.name + ': say "`p <number>" in this channel without the quotes and angle brackets to choose a winner.');

    for (var i in e[1]) {
      server.message(chan, '15' + (Number(i) + 1) + ') ' + parseCard(e[0].blackCard, e[1][i]));
    }
  });

  game.on('judgingEnd', function(e) {
    server.message(chan, '' + e.winner[0].name + ' won the round with ' + parseCard(e.blackCard, e.winner[1]));
  });

  game.on('addPoint', function(e) {
    server.message(chan, '' + e.name + ' now has ' + e.points.length + ' point(s).');
  });
}
newGame();


client.on('PING', function(e) {
  e.server.send('pong', e.params);
});

client.on('001', function(e) {
  e.server.message('NickServ', 'identify custemapp2');
  e.server.join(chan);
});

client.on('JOIN', function(e) {
  if (e.params[0] == chan && e.originNick == nick) {
    //e.server.message(chan, 'HELLO, BILLY MAYS HERE WITH CARDS AGAINST HUMANITY');
  }
});

client.on('PRIVMSG', function(e) {
  var current = players[e.originNick];
  var args = e.params[1].split(' ');
  var cmd = args.shift().substring(0, 2);

  if (cmd == '`j') {
    if (current) { return; }
    players[e.originNick] = game.addPlayer(e.originNick);
  } else if (cmd == '`s') {
    if (!current || game.round) { return; }
    game.startGame();
  } else if (cmd == '`e') {
    if (!game) { return; }
    newGame();
  } else if (cmd == '`p') {
    if (!current) { return; }
    if (!game.round) { return; }
    if (game.round.picking && game.round.judge != current) {
      if (args.every(function(x){return current.hand[x-1] })) {
        var stack = new CAH.Stack();
        for (var i in args) {
          stack.push(current.hand[args[i]-1]);
        }
        game.round.pickSet(current, stack);
      }
    } else if (game.round.judging && game.round.judge == current) {
      if (game.round.choices[args[0]-1]) {
        game.round.pickWinner(args[0]-1);
      }
    }
  }
});