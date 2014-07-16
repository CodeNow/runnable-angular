var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
require('browserify-angular-mocks');

var expect = chai.expect;

var uiRouter = require('angular-ui-router');
var uiAce    = require('angular-ui-ace');
var uiAnimate = require('browserify-angular-animate');

describe('ControllerBuildList'.bold.underline.blue, function () {
  var $appScope,
      $projectLayoutScope,
      $buildListScope,
      $stateParams,
      $state,
      dataBuildList;

  function initState () {
    angular.mock.module(uiRouter);
    angular.mock.module('ngMock');
    angular.mock.module('app');
    angular.mock.inject(function($rootScope, $controller) {
      $state = {};
      $stateParams = {};
      $appScope           = $rootScope.$new();
      $projectLayoutScope = $appScope.$new();
      $buildListScope     = $projectLayoutScope.$new();
      $controller('ControllerApp', {
        $scope: $appScope,
        $state: $state,
        $stateParams: $stateParams
      });
      $controller('ControllerProjectLayout', {
        $scope: $projectLayoutScope,
      });
      $controller('ControllerBuildList', {
        $scope: $buildListScope
      });
      dataBuildList = $buildListScope.dataBuildList;
    });
  }
  beforeEach(initState);

});
