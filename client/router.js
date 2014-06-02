var app    = require('./app');
var routes = require('./config/routes');

app.config(['$stateProvider',
            '$urlRouterProvider',
            '$locationProvider',
            function ($stateProvider,
                      $urlRouterProvider,
                      $locationProvider) {

  $locationProvider.html5Mode(true);

  // redirect unmatched urls
  // $urlRouterProvider.otherwise('/');
  routes.forEach(function (item, index, arr) {
    $stateProvider.state(item.state, {
      url:         item.url,
      templateUrl: item.templateUrl,
      controller:  item.controller
    });
  });

}]);