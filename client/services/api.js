var app       = require('app');
var apiConfig = require('config/api');
var Runnable  = require('runnable');

app.factory('api', ['$http', function ($http) {
  return new Runnable(apiConfig.host);
}]);