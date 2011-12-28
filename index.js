// 
var Client = require('./node-irc').Client;

var admin = 'danotop',
    nick  = '[CaH]',
    chan  = '##cardsagainsthumanity';

var client = new Client(nick);
client.connect('irc.freenode.net');

client.on('001', function(e) {
  e.server.join(chan);
});

client.on('JOIN', function(e) {
  if (e.params[0] == chan && e.originNick == nick) {
    //e.server.message(chan, 'HELLO, BILLY MAYS HERE WITH CARDS AGAINST HUMANITY');
  }
});

client.on('PRIVMSG', function(e) {
  if (e.originNick == admin) {
    if (e.params[0] == nick) {
      e.server.message(chan, e.params[1]);
    } else {
      e.reply('I\'m alive');
    }
  }
});