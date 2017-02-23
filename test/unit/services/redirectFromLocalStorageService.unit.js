'use strict';

describe('redirectFromLocalStorage'.bold.underline.blue, function () {
  var $localStorage;
  var $state;
  var windowMock;
  var keypather;
  var redirectFromLocalStorage;

  beforeEach(function() {
    windowMock = {
      location: ''
    };
    angular.mock.module('app', function ($provide) {
      $provide.value('$window', windowMock);
    });
    angular.mock.inject(function (
      _$state_,
      _$localStorage_,
      _keypather_,
      _redirectFromLocalStorage_
    ) {
      $state = _$state_;
      $localStorage = _$localStorage_;
      keypather = _keypather_;
      redirectFromLocalStorage = _redirectFromLocalStorage_;
      sinon.stub($state, 'go');
    });
  });

  describe('toApp', function() {
    it('valid', function () {
      $localStorage.demo = {
        myDemo: {
          app: 'a url'
        }
      };
      redirectFromLocalStorage.toApp('myDemo');
      sinon.assert.notCalled($state.go);
      expect(windowMock.location).to.equal($localStorage.demo.myDemo.app);
    });

    it('invalid', function () {
      $localStorage.demo = {
        myDemo: {
          app: 'a url'
        }
      };
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
      redirectFromLocalStorage.toApp('notMyDemo');
      sinon.assert.calledWith($state.go, 'noAccess');
    });
  });
});
