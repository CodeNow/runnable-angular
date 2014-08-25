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

describe('ControllerBuildNew'.bold.underline.blue, function () {
  var $scopeControllerApp,
      $scopeControllerProjectLayout,
      $scopeControllerBuildNew,
      $stateParams,
      $state;

  function initState () {
    angular.mock.module(uiRouter);
    angular.mock.module('ngMock');
    angular.mock.module('app');
    angular.mock.inject(function($rootScope,
                                 $injector,
                                 $controller) {
      $stateParams = {};

      $state = $injector.get('$state');

      $scopeControllerApp           = $rootScope.$new();
      $scopeControllerProjectLayout = $scopeControllerApp.$new();
      $scopeControllerBuildNew      = $scopeControllerProjectLayout.$new();

      $controller('ControllerApp', {
        $scope: $scopeControllerApp,
        $state: $state
      });
      $controller('ControllerProjectLayout', {
        $scope: $scopeControllerProjectLayout,
      });
      $controller('ControllerBuildNew', {
        $scope: $scopeControllerBuildNew
      });
    });
  }
  beforeEach(initState);

  describe('repositories', function () {
    it('should list repositories of build', function () {
      console.log($scopeControllerBuildNew);

    });

    it('can add repositories', function () {

    });

    it('can remove repositories', function () {

    });
  });

  describe('files', function () {
  });

  describe('metadata', function () {
  });

});
