var app       = require('app');
var apiConfig = require('config/api');
var Runnable  = require('runnable');

app.factory('api', [function () {
  return user = Runnable(apiConfig.host).anonymous();
}]);

// temporary
app.factory('ensureAnonymous', [function () {
  return function (user, cb) {
    if (user.id()) {
      cb();
    }
    else {
      user.anonymous(cb);
    }
  };
}]);