'use strict';

var $controller,
    $rootScope,
    $scope;
var element;
var $compile;
var $elScope;
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
      _$compile_,
      _$controller_,
      _$rootScope_,
      _keypather_,
      _$q_
    ) {
      $compile = _$compile_;
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      $q = _$q_;
    });
    ctx.instance = runnable.newInstance(
      apiMocks.instances.running,
      {noStore: true}
    );
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
    sinon.stub(ctx.contextVersion, 'rollback', function (opts, cb) {
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
      readOnlySwitchController.state = {
        advanced: true,
        promises: {
          contextVersion: $q.when(ctx.contextVersion)
        },
        instance: ctx.instance
      };
    });
    it('should be a getter', function () {
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.true;
    });
    it('should attempt to update the cv, and set the lastBuiltSimpleContextVersion', function () {
      readOnlySwitchController.state.advanced = false;
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.false;
      readOnlySwitchController.readOnly(true);
      $scope.$digest();
      sinon.assert.calledOnce(ctx.loadingPromiseMock.add);
      sinon.assert.calledOnce(ctx.contextVersion.update);
      sinon.assert.calledOnce(ctx.contextVersion.fetch);
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.true;
      expect(ctx.instance.attrs.lastBuiltSimpleContextVersion, 'lastBuiltSimpleContextVersion').to.be.ok;
      expect(ctx.instance.attrs.lastBuiltSimpleContextVersion.id, 'lastBuiltSimpleContextVersion.id')
        .to.equal(ctx.contextVersion.attrs.id);
      expect(ctx.instance.attrs.lastBuiltSimpleContextVersion.created, 'lastBuiltSimpleContextVersion.created')
        .to.equal(ctx.contextVersion.attrs.created);
    });
    it('should attempt to update the cv, and not change the existing lastBuiltSimpleContextVersion', function () {
      ctx.instance.attrs.lastBuiltSimpleContextVersion = {
        id: ctx.newContextVersion.attrs.id,
        created: ctx.newContextVersion.attrs.created
      };
      readOnlySwitchController.state.advanced = false;
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.false;
      readOnlySwitchController.readOnly(true);
      $scope.$digest();
      sinon.assert.calledOnce(ctx.loadingPromiseMock.add);
      sinon.assert.calledOnce(ctx.contextVersion.update);
      sinon.assert.calledOnce(ctx.contextVersion.fetch);
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.true;
      expect(ctx.instance.attrs.lastBuiltSimpleContextVersion, 'lastBuiltSimpleContextVersion').to.be.ok;
      expect(ctx.instance.attrs.lastBuiltSimpleContextVersion.id, 'lastBuiltSimpleContextVersion.id')
        .to.equal(ctx.newContextVersion.attrs.id);
      expect(ctx.instance.attrs.lastBuiltSimpleContextVersion.created, 'lastBuiltSimpleContextVersion.created')
        .to.equal(ctx.newContextVersion.attrs.created);
    });
  });
  describe('rollback'.blue, function () {
    beforeEach(function () {
      setup();
    });
    beforeEach(function () {
      readOnlySwitchController.state = {
        advanced: true,
        promises: {
          contextVersion: $q.when(ctx.contextVersion)
        },
        instance: ctx.instance
      };
    });
    it('should rollback the cv', function () {
      readOnlySwitchController.state.advanced = true;
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.true;
      var resetStateContextVersionMock = sinon.spy();
      $scope.$on('resetStateContextVersion', function ($event, contextVersion, showSpinner) {
        resetStateContextVersionMock(contextVersion, showSpinner);
      });
      readOnlySwitchController.readOnly(false);
      $scope.$digest();
      expect(readOnlySwitchController.popover.contextVersion, 'cv').to.equal(ctx.contextVersion);
      expect(readOnlySwitchController.popover.active, 'active').to.be.true;
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.true;
      var rollbackThing = {lastBuiltSimpleContextVersion: {}};
      readOnlySwitchController.popover.performRollback(ctx.contextVersion, rollbackThing);
      $scope.$digest();
      sinon.assert.calledOnce(ctx.contextVersion.rollback);
      sinon.assert.calledWith(resetStateContextVersionMock, ctx.newContextVersion, true);
    });

    it('should rollback to the old CV when rollback fails', function () {
      readOnlySwitchController.state.advanced = true;
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.true;
      var resetStateContextVersionMock = sinon.spy();
      $scope.$on('resetStateContextVersion', function ($event, contextVersion, showSpinner) {
        resetStateContextVersionMock(contextVersion, showSpinner);
      });
      readOnlySwitchController.readOnly(false);
      $scope.$digest();
      expect(readOnlySwitchController.popover.contextVersion, 'cv').to.equal(ctx.contextVersion);
      expect(readOnlySwitchController.popover.active, 'active').to.be.true;
      expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.true;
      ctx.contextVersion.rollback = function () {};
      sinon.stub(ctx.contextVersion, 'rollback', function (opts, cb) {
        $rootScope.$evalAsync(function () {
          cb(new Error('asdasdasdasd'));
        });
        return new Error('asdasdasdasd');
      });
      var rollbackThing = {lastBuiltSimpleContextVersion: {}};
      readOnlySwitchController.popover.performRollback(ctx.contextVersion, rollbackThing);
      $scope.$digest();
      sinon.assert.calledOnce(ctx.contextVersion.rollback);
      $scope.$digest();
      sinon.assert.calledWith(resetStateContextVersionMock, ctx.contextVersion, true);
    });
  });
  describe('readOnly error'.blue, function () {
    beforeEach(function () {
      setup();
    });
    beforeEach(function () {
      readOnlySwitchController.state = {
        advanced: false,
        promises: {
          contextVersion: $q.reject(ctx.contextVersion)
        },
        instance: ctx.instance
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
