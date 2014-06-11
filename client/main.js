var app     = require('app');
var angular = require('angular');
var jQuery  = require('jquery'); //required: places $ on window

// Cache all views
var views = require('./build/views/viewBundle');
app.run(['$rootScope', '$templateCache', function ($rootScope, $templateCache) {
  Object.keys(views.Templates).forEach(function (viewName) {
    $templateCache.put(viewName, views.Templates[viewName]());
  });
  // _.each(views.Templates.forEach(function (view, index) {
  //   $templateCache.put(index, view());
  // });

  // leave user at top of page each route change
  $rootScope.$on('$stateChangeSuccess', function () {
    jQuery('html, body').scrollTop(0);
  });
}]);

require('./controllers/index');
require('./services/index');
require('./filters/index');
require('./directives/index');
require('./animations/index');
require('./router');

window.onload = function () {
  module.exports = angular.bootstrap(document, ['app']);
};