var app       = require('app');
var apiConfig = require('config/api');
var Runnable  = require('runnable');

app.factory('api', [function () {
  return {};
  //return new Runnable(apiConfig.host).anonymous();
}]);

// temporary
app.factory('ensureAnonymous', [function () {
  // return function (user, cb) {
  //   if (user.id()) {
  //     cb();
  //   }
  //   else {
  //     user.anonymous(cb);
  //   }
  // };
}]);