var app     = require('./app');
var angular = require('angular');
var _       = require('underscore');

// Cache all views
var views = require('./build/views/viewBundle');
app.run(['$templateCache', function ($templateCache) {
  _.each(views.Templates, function (item, index) {
    console.log(item.call());
    $templateCache.put(index, item.call());
  });
}]);

// bundle application deps w/ browserify by requiring
require('./controllers/controllerIndex');
require('./controllers/controllerAbout');

require('./router');

module.exports = angular.bootstrap(document, ['app']);
