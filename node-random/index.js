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
      if (buffer[0].substring(0,6) == 'Error:') {
        callback(buffer[0]);
      } else {
        callback(null, (method == 'strings') ? buffer : buffer.map(Number));
      }
    });
  }).on('error', function(e) {
    callback(e.message || true);
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

exports.integer = function(min, max, callback) {
  callFirst('integers', {num: 1,   min: min, max: max, col: 1, base: 10}, callback);
}
exports.integers = function(num, min, max, callback) {
  callArray('integers', {num: num, min: min, max: max, col: 1, base: 10}, callback);
}

exports.sequence = function(min, max, callback) {
  callArray('sequences', {min: min, max: max, col: 1}, callback);
}

// digits, upperalpha, loweralpha
exports.string = function(len, sets, callback) {
  callFirst('strings', toHash(sets, {num: 1,   len: len}), callback);
}
exports.strings = function(num, len, sets, callback) {
  callArray('strings', toHash(sets, {num: num, len: len}), callback);
}

exports.quota = function(ip, callback) {
  if (callback) {
    callFirst('quota', {ip: ip}, callback);
  } else {
    callFirst('quota', {}, ip);
  }
}

exports.shuffle = function(array, callback) {
  this.sequence(0, array.length - 1, function(err, numbers) {
    if (err) { return callback(err, array); }

    var result = [];
    for (var i in numbers) {
      result[i] = array[numbers[i]];
    }

    callback(null, result);
  });
}
