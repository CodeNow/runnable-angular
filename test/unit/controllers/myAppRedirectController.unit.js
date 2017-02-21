'use strict';

require('../apiMocks/index');

describe('MyAppRedirectController'.bold.underline.blue, function () {
  var $controller;
  var $rootScope;
  var $scope;
  var $state;
  var $localStorage;

  beforeEach(function() {
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
          app: 'a url'
        }
      };
      $state.params = {
        demoName: 'myDemo'
      };
      $controller('MyAppRedirectController');

      expect($state.params.demoName).to.equal('myDemo');
      sinon.assert.notCalled($state.go);
    });

    it('invalid', function () {
      $state.go = sinon.stub();
      $localStorage.demo = {
        myDemo: {
          app: 'a url'
        }
      };
      $state.params = {
        demoName: 'notvalid'
      };
      $controller('MyAppRedirectController');

      sinon.assert.calledWith($state.go, 'noAccess');
    });
  });
});
