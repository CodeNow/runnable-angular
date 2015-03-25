'use strict';

var $controller,
    $rootScope,
    $scope,
    $window;
var keypather;

var User = require('runnable/lib/models/user');
var apiMocks = require('../apiMocks/index');
var isFunction = require('101/is-function');
var keypather = require('keypather')();

describe('controllerApp'.bold.underline.blue, function () {
  var ctx = {};
  function setup(stateParams, heap, intercom, olark) {
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
    var fetchUserMock = function (cb) {
      cb(null, ctx.fakeuser);
    };
    var fetchOrgsMock = function(cb) {
      cb(null, {models: [ctx.fakeOrg1, ctx.fakeOrg2]});
    };
    ctx.stateParams = stateParams || {
      userName: 'username',
      instanceName: 'instancename'
    };
    angular.mock.module('app', function ($provide) {
      $provide.value('fetchUser', fetchUserMock);
      $provide.value('fetchOrgs', fetchOrgsMock);
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
    if ($window.olark) {
      sinon.stub($window, 'olark', noop);
    }
    var ca = $controller('ControllerApp', {
      '$scope': $scope
    });
  }

  function tearDown () {
    keypather.get($window, 'Intercom.restore()');
    keypather.get($window, 'olark.restore()');
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
      var clicked;
      $rootScope.$digest();

      $scope.$on('app-document-click', function () {
        clicked = true;
      });

      $scope.dataApp.documentClickEventHandler();

      expect(clicked).to.be.true;
    });
  });

  describe('account stuff'.blue, function () {
    describe('No account already chosen'.blue, function () {
      it('should select user if nothing matches name in url ', function (done) {
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
      it('should select user, matching it from the stateParams ', function (done) {
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
      it('should select org1, matching it from the stateParams ', function (done) {
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
    it('should switch accounts if active account does not match url', function (done) {
      setup({}, false, true);
      var listFetchSpy = sinon.spy(function(event, name) {
        expect(name).to.equal(ctx.fakeOrg2.oauthName());
        expect($scope.dataApp.data.activeAccount).to.be.an.Object;
        expect($scope.dataApp.data.activeAccount).to.equal(ctx.fakeOrg2);
        done();
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
