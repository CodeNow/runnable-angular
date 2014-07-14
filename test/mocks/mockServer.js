var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var http = require('http');
var request = require('request');
var app = express();

var user = require('./user');

function useCors (req, res, next) {
  cors({
    origin: function (origin, callback) {
      callback(null, (origin === 'http://localhost:3001/'));
    },
    credentials: true
  })(req, res, next);
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('*', function (req, res) {
  var method = req.method;
  var path = req.url;
  var query = req.query;
  var body = req.body;
  var cookie = req.get('cookie');

  console.log('cookie', cookie);

  request({
    method: method,
    url: 'http://api.runnable3.net'+path
  }, function (err, httpIR, response) {
    console.log('callback');
    console.log(err);
    console.log(response);
  });
  res.json({test: true});
});

http.createServer(app).listen(3002, function () {
  console.log('listening on port 3002...');
});

