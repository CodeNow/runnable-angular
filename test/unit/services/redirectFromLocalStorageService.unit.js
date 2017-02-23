'use strict';

describe('redirectFromLocalStorage'.bold.underline.blue, function () {
  var $localStorage;
  var $state;
  var $window;
  var keypather;
  var redirectFromLocalStorage;

  beforeEach(function() {
    angular.mock.module('app');
    angular.mock.inject(function (
      _$state_,
      _$localStorage_,
      _$window_,
      _keypather_,
      _redirectFromLocalStorage_
    ) {
      $state = _$state_;
      $localStorage = _$localStorage_;
      $window = _$window_;
      keypather = _keypather_;
      redirectFromLocalStorage = _redirectFromLocalStorage_;
    });
  });

  describe('toApp', function() {
    it('valid', function () {
      $localStorage.demo = {
        myDemo: {
          app: 'a url'
        }
      };
      $state.go = sinon.stub();

      redirectFromLocalStorage.toApp('myDemo');
      sinon.assert.notCalled($state.go);
    });

    it('invalid', function () {
      $localStorage.demo = {
        myDemo: {
          app: 'a url'
        }
      };
      $state.go = sinon.stub();

      redirectFromLocalStorage.toApp('notMyDemo');
      sinon.assert.calledWith($state.go, 'noAccess');
    });
  });

  describe('toRunApp', function() {
    it('valid', function () {
      $localStorage.demo = {
        myDemo: {
          runnable: {
            userName: 'userName',
            instanceName: 'instanceName'
          }
        }
      };
      $state.go = sinon.stub();

      redirectFromLocalStorage.toRunApp('myDemo');
      sinon.assert.calledWith($state.go, 'base.instances.instance', {
        userName: 'userName',
        instanceName: 'instanceName'
      });
    });

    it('invalid', function () {
      $localStorage.demo = {
        myDemo: {
          runnable: {
            userName: 'userName',
            instanceName: 'instanceName'
          }
        }
      };
      $state.go = sinon.stub();

      redirectFromLocalStorage.toApp('notMyDemo');
      sinon.assert.calledWith($state.go, 'noAccess');
    });
  });
});
