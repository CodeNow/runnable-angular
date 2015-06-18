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
app.set('https_port', process.env.HTTPS_PORT || 443);
app.set('config', config);
app.set('view engine', 'jade');
app.locals.version = version;
app.locals.env = config.env;
app.locals.commitHash = require('../client/config/json/commit.json').commitHash;
app.locals.commitTime = require('../client/config/json/commit.json').commitTime;
app.locals.apiHost = require('../client/config/json/api.json').host;
app.set('views', path.join(__dirname + '/views'));

// Redirect to https
if (process.env.HTTPS) {
  app.use(function(req, res, next) {
    if (envIs('production') && !req.secure) {
      return res.redirect(301, ['https://', req.get('Host'), req.url].join(''));
    }
    next();
  });
}

app.use(compression());

app.use('/build', express.static(path.join(__dirname + '/../client/build')));

app.route('/').get(function (req, res, next) {
  res.render('home', {
    hasPassord: req.query.password !== undefined
  });
});


// load same base view for all valid client-routes
require('client/config/routes').forEach(function (item, index, arr) {
  if (!item.url) { return; }
  app.route(item.url).get(function (req, res, next) {
    res.render('layout', {
      debug: (req.query.debug !== undefined) ? true : false
    });
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
