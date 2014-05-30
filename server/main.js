var express     = require('express');
var path        = require('path');
var compression = require('compression');
var config      = require('server/config/' + (process.env.NODE_ENV || 'development'));
var app         = require('server/app');

app.set('port', process.env.PORT || 3000);
app.set('config', config);
app.set('view engine', '');
app.set('views', path.join(__dirname + '/server/views'));
app.use('/public', express.static(path.join(__dirname + '/client')));
app.use(compression());

// load same base view for all valid client-routes
require('client/config/routes').forEach(function (item, index, arr) {
  app.route(item.route).get(function (req, res next) {
    res.render('layout');
  });
});

app.listen(app.get('port'), function () {
  console.log('App listening at port: ' + app.get('port'));
});