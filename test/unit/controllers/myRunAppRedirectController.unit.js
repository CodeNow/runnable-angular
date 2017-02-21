'use strict';

require('../apiMocks/index');

describe('MyRunAppRedirectController'.bold.underline.blue, function () {
  var $controller;
  var $rootScope;
  var $scope;
  var $state;
  var $localStorage;

  beforeEach(function () {
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
  });

  describe('controllerConstructor', function() {
    it('valid', function () {
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
      $controller('MyRunAppRedirectController');

      sinon.assert.calledWith($state.go, 'base.instances.instance', {
        userName: 'userName',
        instanceName: 'instanceName'
      });
    });

    it('invalid', function () {
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
      $controller('MyRunAppRedirectController');

      sinon.assert.calledWith($state.go, 'noAccess');
    });
  });
});
