'use strict';

var app         = require('server/app');

var envIs       = require('101/env-is');
var express     = require('express');
var fs          = require('fs');
var http        = require('http');
var https       = require('https');
var path        = require('path');
var assign = require('101/assign');

app.set('port', process.env.PORT || 3000);
app.set('https_port', process.env.HTTPS_PORT || 443);

// Redirect to https
if (process.env.HTTPS) {
  app.use(function(req, res, next) {
    if (envIs('production') && !req.secure) {
      return res.redirect(301, ['https://', req.get('Host'), req.url].join(''));
    }
    next();
  });
}
app.use(function (req, res, next) {
  res.setHeader('Content-Encoding','gzip');
  next();
});

app.use('/build', express.static(path.join(__dirname + '/../client/dist')));

app.route('/').get(function (req, res, next) {
  res.sendFile(path.join(__dirname + '/../client/dist/index.html'));
});

// load same base view for all valid client-routes
require('client/config/routes').forEach(function (item) {
  if (!item.url) { return; }
  app.route(item.url).get(function (req, res) {
    res.sendFile(path.join(__dirname + '/../client/dist/app.html'));
  });
});

var options = {
  ca: fs.readFileSync('server/config/certs/server.csr'),
  cert: fs.readFileSync('server/config/certs/server.crt'),
  key: fs.readFileSync('server/config/certs/server.key')
};

http.createServer(app).listen(app.get('port'), function () {
  console.log('server listening on port ' + app.get('port'));
});

if (process.env.HTTPS) {
  https.createServer(options, app).listen(app.get('https_port'), function () {
    console.log('server listening on port ' + app.get('https_port'));
  });
}
