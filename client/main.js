var app     = require('app');
var angular = require('angular');
var $       = require('jquery'); //required: places $ on window

require('./controllers/index');
require('./services/index');
require('./filters/index');
require('./directives/index');
require('./animations/index');
require('./lib/router');

// Cache all views
var views = require('./build/views/viewBundle');
app.run(['$rootScope', '$templateCache', function ($rootScope, $templateCache) {
  Object.keys(views.Templates).forEach(function (viewName) {
    $templateCache.put(viewName, views.Templates[viewName]());
  });
  // leave user at top of page each route change
  $rootScope.$on('$stateChangeSuccess', function () {
    $('html, body').scrollTop(0);
  });
}]);

$(function () {
  angular.bootstrap(document, ['app']);
});
