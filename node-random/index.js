var http = require('http');

function callArray(method, params, callback) {
  var query = 'format=plain'
  for (var i in (params || {})) {
    query += '&' + i + '=' + params[i];
  }

  var options = {
    host: 'www.random.org',
    port: 80,
    path: '/' + method + '/?' + query
  };

  http.get(options, function(res) {
    var buffer = '';

    res.on('data', function (chunk) {
      buffer += chunk;
    });
    res.on('end', function (chunk) {
      buffer = buffer.substring(0, buffer.length - 1).split("\n");
      callback(null, (method == 'strings') ? buffer : buffer.map(Number));
    });
  }).on('error', function(e) {
    callback(e.message);
  });
}

function callFirst(method, params, callback) {
  callArray(method, params, function(err, array) {
    callback(err, array ? array[0] : null);
  });
}

function toHash(sets, hash) {
  hash = hash || {};
  for (var i in sets) {
    hash[sets[i]] = 'on';
  }
  return hash;
}

exports = {
  integer: function(min, max, callback) {
    callFirst('integers', {num: 1,   min: min, max: max, col: 1, base: 10}, callback);
  },
  integers: function(num, min, max, callback) {
    callArray('integers', {num: num, min: min, max: max, col: 1, base: 10}, callback);
  },

  sequence: function(min, max, callback) {
    callArray('sequence', {min: min, max: max, col: 1}, callback);
  },

  // digits, upperalpha, loweralpha
  string: function(len, sets, callback) {
    callFirst('strings', toHash(sets, {num: 1,   len: len}), callback);
  },
  strings: function(num, len, sets, callback) {
    callArray('strings', toHash(sets, {num: num, len: len}), callback);
  },

  quota: function(ip, callback) {
    if (callback) {
      callFirst('quota', {ip: ip}, callback);
    } else {
      callFirst('quota', {}, ip);
    }
  }
}
