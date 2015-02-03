'use strict';

var app         = require('server/app');
var compression = require('compression');
var config      = require('server/config/' + (process.env.NODE_ENV || 'development'));
var envIs       = require('101/env-is');
var express     = require('express');
var fs          = require('fs');
var http        = require('http');
var https       = require('https');
var path        = require('path');
var version     = require('../package').version;

app.set('port', process.env.PORT || 3000);
app.set('config', config);
app.set('view engine', 'jade');
app.locals.version = version;
app.locals.env = config.env;
app.locals.commitHash = require('../client/config/json/commit.json').commitHash;
app.locals.commitTime = require('../client/config/json/commit.json').commitTime;
app.set('views', path.join(__dirname + '/views'));

// Redirect to https
app.use(function(req, res, next) {
  if (envIs('production') && !req.secure) {
    return res.redirect(301, ['https://', req.get('Host'), req.url].join(''));
  }
  next();
});

app.use(compression());
app.use(require('cookie-parser')());

app.use('/build', express.static(path.join(__dirname + '/../client/build')));

// load same base view for all valid client-routes
require('client/config/routes').forEach(function (item, index, arr) {
  if (!item.url) { return; }
  app.route(item.url).get(function (req, res, next) {
    res.render('layout');
  });
});

var options = {
  ca: fs.readFileSync('server/config/certs/server.csr'),
  cert: fs.readFileSync('server/config/certs/server.crt'),
  key: fs.readFileSync('server/config/certs/server.key')
};

http.createServer(app).listen(3001, function () {
  console.log('server listening on port 3001');
});
https.createServer(options, app).listen(443, function () {
  console.log('server listening on port 443');
});
