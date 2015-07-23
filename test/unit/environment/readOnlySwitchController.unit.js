'use strict';

var $controller,
    $rootScope,
    $scope;
var keypather;
var $q;
var readOnlySwitchController;
var apiMocks = require('../apiMocks/index');
var mockFactory = require('../apiMocks/apiClientMockFactory');

describe('ReadOnlySwitchController'.bold.underline.blue, function () {
  var ctx = {};
  function setup() {

    angular.mock.module('app', function ($provide) {
      $provide.factory('loadingPromises', function ($q) {
        ctx.loadingPromiseMock = {
          add: sinon.spy(function (namespace, promise) {
            return promise;
          }),
          clear: sinon.spy(),
          finished: sinon.spy(function () {
            return $q.when(ctx.loadingPromiseFinishedValue);
          })
        };
        return ctx.loadingPromiseMock;
      });
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _keypather_,
      _$q_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      $q = _$q_;
    });

    ctx.contextVersion = mockFactory.contextVersion(
      runnable,
      apiMocks.contextVersions.running
    );
    ctx.newContextVersion = mockFactory.contextVersion(
      runnable,
      apiMocks.contextVersions.setup
    );
    sinon.stub(ctx.contextVersion, 'fetch', function (cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.contextVersion);
      });
      return ctx.contextVersion;
    });
    sinon.stub(ctx.contextVersion, 'update', function (opts, cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.contextVersion);
      });
      return ctx.contextVersion;
    });
    sinon.stub(ctx.contextVersion, 'rollback', function (cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.newContextVersion);
      });
      return ctx.newContextVersion;
    });
    readOnlySwitchController = $controller('ReadOnlySwitchController', {
      '$scope': $scope
    });
  }
  describe('basics'.blue, function () {
    beforeEach(function () {
      setup();
    });
    it('should exist', function () {
      expect(readOnlySwitchController, 'readOnlySwitchController').to.be.ok;
      expect(readOnlySwitchController.readOnly, 'readOnly').to.be.ok;
    });
  });
  describe('readOnly'.blue, function () {
    beforeEach(function () {
      setup();
    });
    beforeEach(function () {
      $scope.state = {
        advanced: true,
        promises: {
          contextVersion: $q.when(ctx.contextVersion)
        }
      };
    });
    it('should be a getter', function () {
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.true;
    });
    it('should attempt to update the cv', function () {
      $scope.state.advanced = false;
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.false;
      readOnlySwitchController.readOnly(true);
      $scope.$digest();
      sinon.assert.calledOnce(ctx.loadingPromiseMock.add);
      sinon.assert.calledOnce(ctx.contextVersion.update);
      sinon.assert.calledOnce(ctx.contextVersion.fetch);
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.true;
    });
  });
  describe('rollback'.blue, function () {
    beforeEach(function () {
      setup();
    });
    beforeEach(function () {
      $scope.state = {
        advanced: true,
        promises: {
          contextVersion: $q.when(ctx.contextVersion)
        }
      };
    });
    it.skip('should rollback the cv', function () {
      $scope.state.advanced = true;
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.true;
      readOnlySwitchController.readOnly(false);
      $scope.$digest();
      $scope.resetStateContextVersion = sinon.spy();
      sinon.assert.calledOnce(ctx.contextVersion.rollback);
      expect(readOnlySwitchController.popover.rolledContextVersion, 'rolledCV').to.equal(ctx.newContextVersion);
      expect(readOnlySwitchController.popover.active, 'active').to.be.true;
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.true;
      readOnlySwitchController.popover.performRollback(readOnlySwitchController.popover.rolledContextVersion);
      $scope.$digest();
      sinon.assert.calledWith($scope.resetStateContextVersion, readOnlySwitchController.popover.rolledContextVersion, true);
    });
  });
  describe('readOnly error'.blue, function () {
    beforeEach(function () {
      setup();
    });
    beforeEach(function () {
      $scope.state = {
        advanced: false,
        promises: {
          contextVersion: $q.reject(ctx.contextVersion)
        }
      };
    });
    it('should attempt to update the cv', function () {
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.false;
      readOnlySwitchController.readOnly(true);
      $scope.$digest();
      sinon.assert.notCalled(ctx.loadingPromiseMock.add);
      sinon.assert.notCalled(ctx.contextVersion.update);
      sinon.assert.notCalled(ctx.contextVersion.fetch);
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.false;
    });
  });
});
