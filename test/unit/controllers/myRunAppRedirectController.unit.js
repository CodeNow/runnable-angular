'use strict';

require('../apiMocks/index');

describe('MyRunAppRedirectController'.bold.underline.blue, function () {
  var MRAR;
  var $controller;
  var $rootScope;
  var $scope;
  var $state;
  var $localStorage;

  function injectSetupCompile() {
    angular.mock.module('app');

    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$state_,
      _$localStorage_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $state = _$state_;
      $localStorage = _$localStorage_;
    });
  }

  beforeEach(function () {
    injectSetupCompile();
  });

  describe('controllerConstructor valid', function() {
    it('base', function () {
      $state.go = sinon.stub();
      $localStorage.demo = {
        myDemo: {
          runnable: {
            userName: 'userName',
            instanceName: 'instanceName'
          }
        }
      };
      $state.params = {
        demoName: 'myDemo'
      };

      MRAR = $controller('MyRunAppRedirectController', {
        $scope: $scope,
        $state: $state,
        $localStorage: $localStorage
      });

      sinon.assert.calledWith($state.go, 'base.instances.instance', {
        userName: 'userName',
        instanceName: 'instanceName'
      });
    });
  });

  describe('controllerConstructor invalid', function() {
    it('base', function () {
      $state.go = sinon.stub();
      $localStorage.demo = {
        myDemo: {
          runnable: {
            userName: 'userName',
            instanceName: 'instanceName'
          }
        }
      };
      $state.params = {
        demoName: 'doesNotMatch'
      };

      MRAR = $controller('MyRunAppRedirectController', {
        $scope: $scope,
        $state: $state,
        $localStorage: $localStorage
      });

      sinon.assert.calledWith($state.go, 'noAccess');
    });
  });
});
