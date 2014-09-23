var express     = require('express');
var path        = require('path');
var compression = require('compression');
var config      = require('server/config/' + (process.env.NODE_ENV || 'development'));
var app         = require('server/app');
var package     = require('package');

app.set('port', process.env.PORT || 3000);
app.set('config', config);
app.set('view engine', 'jade');
app.locals.version = package.version;
app.locals.env = config.env;
app.set('views', path.join(__dirname + '/views'));
app.use(compression());
app.use(require('cookie-parser')());

app.use(function (req, res, next) {
  if (req.query && req.query.password) {
    res.cookie('password', 'runnable', {
      expires: new Date(Date.now() + 90000000)
    });
    next();
  } else {
    if (!req.cookies|| !req.cookies.password) {
      res.status(404).end();
    } else {
      next();
    }
  }
});

app.use('/build', express.static(path.join(__dirname + '/../client/build')));

// load same base view for all valid client-routes
require('client/config/routes').forEach(function (item, index, arr) {
  if (!item.url)
    return;
  app.route(item.url).get(function (req, res, next) {
    res.render('layout');
  });
});

app.listen(app.get('port'), function () {
  console.log('App listening on port: ' + app.get('port'));
});
