/*global runnable:true */
'use strict';

var $controller,
    $rootScope,
    $scope;
var element;
var $compile;
var $elScope;
var keypather;
var ModalService;
var $q;
var readOnlySwitchController;
var apiMocks = require('../apiMocks/index');
var mockFactory = require('../apiMocks/apiClientMockFactory');
var dockerfile = {
  attrs: {
    body: angular.copy(apiMocks.files.dockerfile)
  }
};

describe.only('ReadOnlySwitchController'.bold.underline.blue, function () {
  var ctx = {};
  function setup() {

    angular.mock.module('app', function ($provide) {
      $provide.factory('ModalService', function ($q) {
        ModalService = {
          showModal: sinon.stub().returns($q.when({
            close: $q.when(true)
          }))
        };
        return ModalService;
      });
      $provide.factory('updateDockerfileFromState', function ($q) {
        return sinon.stub().returns($q.when(true));
      });
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
    ctx.theFirstContextVersion = mockFactory.contextVersion(
      runnable,
      apiMocks.contextVersions.angular
    );
    ctx.instance.contextVersion = ctx.theFirstContextVersion;
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
    sinon.stub(ctx.contextVersion, 'fetchFile', function (opts, cb) {
      $rootScope.$evalAsync(function () {
        cb(null, dockerfile);
      });
      return ctx.newContextVersion;
    });
    sinon.stub(ctx.contextVersion, 'deepCopy', function (cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.newContextVersion);
      });
      return ctx.contextVersion;
    });

    readOnlySwitchController = $controller('ReadOnlySwitchController', {
      '$scope': $scope
    });
  }

  beforeEach(setup);

  describe('basics'.blue, function () {

    it('should exist', function () {
      expect(readOnlySwitchController, 'readOnlySwitchController').to.be.ok;
      expect(readOnlySwitchController.readOnly, 'readOnly').to.be.ok;
    });

  });

  describe('readOnly'.blue, function () {

    describe('With Instance', function () {

      beforeEach(function () {
        readOnlySwitchController.state = {
          advanced: true,
          promises: {
            contextVersion: $q.when(ctx.contextVersion)
          },
          instance: ctx.instance,
          contextVersion: ctx.contextVersion
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
          .to.equal(ctx.theFirstContextVersion.attrs.id);
        expect(ctx.instance.attrs.lastBuiltSimpleContextVersion.created, 'lastBuiltSimpleContextVersion.created')
          .to.equal(ctx.theFirstContextVersion.attrs.created);
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

      it('should switch revert back to the original context version when switching back to simple mode', function () {
        var simpleCVId = keypather.get(readOnlySwitchController, 'state.contextVersion.attrs._id');
        readOnlySwitchController.state.advanced = false;
        expect(simpleCVId).to.be.a.string;

        // Switch to advanced mode
        readOnlySwitchController.readOnly(true);
        $scope.$digest();
        var advancedCVId = keypather.get(readOnlySwitchController, 'state.contextVersion.attrs._id');
        expect(advancedCVId).to.not.equal(simpleCVId);

        // Switch back to simple mode
        readOnlySwitchController.readOnly(true);
        $scope.$digest();
        var newSimpleCVId = keypather.get(readOnlySwitchController, 'state.contextVersion.attrs._id');
        expect(newSimpleCVId).to.equal(simpleCVId);
      });

    });

    describe('With No Instance', function () {

      beforeEach(function () {
        readOnlySwitchController.state = {
          advanced: true,
          promises: {
            contextVersion: $q.when(ctx.contextVersion)
          },
          instance: false,
          contextVersion: ctx.contextVersion
        };
      });

      it('should attempt to update the cv, but not set the `lastBuiltSimpleContextVersion`', function () {
        readOnlySwitchController.state.advanced = false;
        expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.false;
        readOnlySwitchController.readOnly(true);
        $scope.$digest();
        $scope.$digest();
        sinon.assert.calledOnce(ctx.loadingPromiseMock.add);
        sinon.assert.calledOnce(ctx.contextVersion.update);
        sinon.assert.calledOnce(ctx.contextVersion.fetch);
        expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.true;
        expect(keypather.get(readOnlySwitchController, 'state.allContextVersions.simple')).to.be.an.object;
        // `lastBuiltSimpleContextVersion` is not necessary when there is not instance
        expect(ctx.instance.attrs.lastBuiltSimpleContextVersion, 'lastBuiltSimpleContextVersion').to.not.be.ok;
      });

      it('should attempt to update the cv, and not change the existing lastBuiltSimpleContextVersion', function () {
        $scope.$emit = sinon.stub();
        readOnlySwitchController.state.advanced = true;
        expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.true;
        readOnlySwitchController.readOnly(false);
        $scope.$digest();
        sinon.assert.calledOnce(ModalService.showModal);
        sinon.assert.calledOnce($scope.$emit);
        sinon.assert.calledWith($scope.$emit, 'resetStateContextVersion');
        expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.false;
      });

    });

  });

  describe('rollback'.blue, function () {

    describe('With Instance', function () {

      beforeEach(function () {
        readOnlySwitchController.state = {
          advanced: true,
          promises: {
            contextVersion: $q.when(ctx.contextVersion)
          },
          instance: ctx.instance,
          contextVersion: ctx.contextVersion
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
        ctx.contextVersion.rollback = function () {};
        sinon.stub(ctx.contextVersion, 'rollback', function (opts, cb) {
          $rootScope.$evalAsync(function () {
            cb(new Error('asdasdasdasd'));
          });
          return new Error('asdasdasdasd');
        });
        readOnlySwitchController.readOnly(false);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.contextVersion.rollback);
        sinon.assert.calledWith(resetStateContextVersionMock, ctx.contextVersion, true);
      });

    });

  });

  describe('readOnly error'.blue, function () {
    beforeEach(function () {
      readOnlySwitchController.state = {
        advanced: false,
        promises: {
          contextVersion: $q.reject(ctx.contextVersion)
        },
        instance: ctx.instance,
        contextVersion: ctx.contextVersion
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
