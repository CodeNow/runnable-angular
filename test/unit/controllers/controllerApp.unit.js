'use strict';

var $controller,
    $rootScope,
    $scope,
    $window;
var keypather;

var User = require('runnable/lib/models/user');
var apiMocks = require('../apiMocks/index');
var keypather = require('keypather')();
var User = require('runnable/lib/models/user');
var user = require('../apiMocks').user;

describe('controllerApp'.bold.underline.blue, function () {
  var ctx = {};
  function setup(stateParams, heap, intercom) {
    angular.mock.module('app');
    ctx.fakeuser = new User(angular.copy(apiMocks.user));
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      }
    };
    ctx.fakeOrg2 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org2';
      }
    };
    var mockUserFetch = new (require('../fixtures/mockFetch'))();
    var fetchOrgsMock = function ($q) {
      return function () {
        return $q.when({models: [ctx.fakeOrg1, ctx.fakeOrg2]});
      };
    };
    ctx.stateParams = stateParams || {
      userName: 'username',
      instanceName: 'instancename'
    };
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchUser', mockUserFetch.fetch());
      $provide.factory('fetchOrgs', fetchOrgsMock);
      $provide.value('$stateParams', ctx.stateParams);
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _keypather_,
      _$window_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      $window = _$window_;
    });
    if (heap) {
      $window.heap = {
        identify: sinon.spy()
      };
    }
    if ($window.Intercom) {
      sinon.stub($window, 'Intercom', noop);
    }

    var ca = $controller('ControllerApp', {
      '$scope': $scope
    });
    mockUserFetch.triggerPromise(ctx.fakeuser);
    $rootScope.$apply();
  }

  function tearDown () {
    keypather.get($window, 'Intercom.restore()');
  }

  describe('basics'.blue, function () {

    beforeEach(function () {
      // Error when not wrapped
      setup();
    });

    afterEach(function () {
      tearDown();
    });

    it('initalizes $scope.dataApp properly', function () {
      expect($scope.dataApp).to.be.an.Object;
      $rootScope.$digest();
    });

    it('creates a click handler that broadcasts', function () {
      $rootScope.$digest();

      var spy = sinon.spy();
      $scope.$on('app-document-click', spy);

      $scope.dataApp.documentClickEventHandler({
        target: 'foo'
      });

      expect(spy.calledOnce).to.equal(true);
      expect(spy.lastCall.args[1]).to.equal('foo');
    });
  });

  describe('account stuff'.blue, function () {
    describe('No account already chosen'.blue, function () {
      it('should select user if nothing matches name in url', function (done) {
        setup({});
        var listFetchSpy = sinon.spy(function(event, name) {
          expect(name).to.equal(ctx.fakeuser.oauthName());
          expect($scope.dataApp.data.activeAccount).to.be.an.Object;
          expect($scope.dataApp.data.activeAccount).to.equal(ctx.fakeuser);
          done();
        });
        $scope.$on('INSTANCE_LIST_FETCH', listFetchSpy);
        $rootScope.$digest();
        $rootScope.$broadcast('$stateChangeStart', null, {
          userName: 'username'
        });
        $rootScope.$digest();
      });
      it('should select user, matching it from the stateParams', function (done) {
        setup({});
        var listFetchSpy = sinon.spy(function(event, name) {
          expect(name).to.equal(ctx.fakeuser.oauthName());
          expect($scope.dataApp.data.activeAccount).to.be.an.Object;
          expect($scope.dataApp.data.activeAccount).to.equal(ctx.fakeuser);
          done();
        });
        $scope.$on('INSTANCE_LIST_FETCH', listFetchSpy);
        $rootScope.$digest();
        $rootScope.$broadcast('$stateChangeStart', null, {
          userName: ctx.fakeuser.oauthName()
        });
        $rootScope.$digest();
      });
      it('should select org1, matching it from the stateParams', function (done) {
        setup({}, false, false, true);
        var listFetchSpy = sinon.spy(function(event, name) {
          expect(name).to.equal(ctx.fakeOrg1.oauthName());
          expect($scope.dataApp.data.activeAccount).to.be.an.Object;
          expect($scope.dataApp.data.activeAccount).to.equal(ctx.fakeOrg1);
          done();
        });
        $scope.$on('INSTANCE_LIST_FETCH', listFetchSpy);
        $rootScope.$digest();
        $rootScope.$broadcast('$stateChangeStart', null, {
          userName: ctx.fakeOrg1.oauthName()
        });
        $rootScope.$digest();
      });
    });
    it('should not switch accounts if active account matches', function () {
      setup({}, true);
      var listFetchSpy = sinon.spy();
      keypather.set($scope, 'dataApp.data.activeAccount', ctx.fakeOrg1);
      $scope.$on('INSTANCE_LIST_FETCH', listFetchSpy);
      $rootScope.$digest();
      $rootScope.$broadcast('$stateChangeStart', null, {
        userName: ctx.fakeOrg1.oauthName()
      });
      $rootScope.$digest();
      expect($scope.dataApp.data.activeAccount).to.be.an.Object;
      expect($scope.dataApp.data.activeAccount).to.equal(ctx.fakeOrg1);
      sinon.assert.notCalled(listFetchSpy);
    });
    it('should switch accounts if active account does not match url', function () {
      setup({}, false, true);
      var listFetchSpy = sinon.spy(function(event, name) {
        expect(name).to.equal(ctx.fakeOrg2.oauthName());
        expect($scope.dataApp.data.activeAccount).to.be.an.Object;
        expect($scope.dataApp.data.activeAccount).to.equal(ctx.fakeOrg2);
      });
      keypather.set($scope, 'dataApp.data.activeAccount', ctx.fakeOrg1);
      $scope.$on('INSTANCE_LIST_FETCH', listFetchSpy);
      $rootScope.$digest();
      $rootScope.$broadcast('$stateChangeStart', null, {
        userName: ctx.fakeOrg2.oauthName()
      });
      $rootScope.$digest();
    });
  });
});
