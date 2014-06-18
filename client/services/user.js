var app       = require('app');
var apiConfig = require('config/api');
var Runnable  = require('runnable');

app.factory('user', function () {
  return new Runnable(apiConfig.host);
});
