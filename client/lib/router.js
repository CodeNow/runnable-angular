'use strict';

var app = require('app');
var routes = require('config/routes');

app.config(['$stateProvider',
  '$urlRouterProvider',
  '$locationProvider',
  function ($stateProvider,
    $urlRouterProvider,
    $locationProvider) {

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });

    // redirect unmatched urls
    // $urlRouterProvider.otherwise('/');

    // force trailing slash on all urls
    $urlRouterProvider.rule(function ($injector, $location) {
      var path = $location.path();
      var search = $location.search();
      var params;

      if (path[path.length - 1] === '/') { return; }

      if (Object.keys(search).length === 0) { return path + '/'; }

      params = [];
      angular.forEach(search, function (val, key) {
        params.push(key + '=' + val);
      });
      return path + '/?' + params.join('&');
    });

    routes.forEach(function (item) {
      var state = item.state;
      item.url = ((typeof item.url === 'string' && item.url[item.url.length - 1] !== '/') ? item.url + '/' : item.url);
      $stateProvider.state(state, item);
    });

  }
]);
