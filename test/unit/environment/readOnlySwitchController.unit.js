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

describe('ReadOnlySwitchController'.bold.underline.blue, function () {
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
    ctx.thirdContextVersion = mockFactory.contextVersion(
      runnable,
      apiMocks.contextVersions.angular
    );
    ctx.theFirstContextVersion = mockFactory.contextVersion(
      runnable,
      apiMocks.contextVersions.angular
    );
    ctx.instance.contextVersion = ctx.theFirstContextVersion;
    var returnArg = function (returnArg, callbackArg) {
      return function () {
        var args = Array.prototype.slice.call(arguments);
        var cb = args[args.length - 1]; // The callback will be the last argument
        $rootScope.$evalAsync(function () {
          if (callbackArg !== undefined) {
            cb(null, callbackArg);
          } else {
            cb(null, returnArg);
          }
        });
        return returnArg;
      };
    };
    sinon.stub(ctx.contextVersion, 'fetch', returnArg(ctx.contextVersion));
    sinon.stub(ctx.contextVersion, 'update', returnArg(ctx.contextVersion));
    sinon.stub(ctx.contextVersion, 'rollback', returnArg(ctx.newContextVersion));
    sinon.stub(ctx.contextVersion, 'deepCopy', returnArg(ctx.newContextVersion));
    sinon.stub(ctx.contextVersion, 'fetchFile', returnArg(ctx.newContextVersion, dockerfile));
    // newContextVersion
    sinon.stub(ctx.newContextVersion, 'fetch', returnArg(ctx.contextVersion));
    sinon.stub(ctx.newContextVersion, 'update', returnArg(ctx.contextVersion));
    sinon.stub(ctx.newContextVersion, 'deepCopy', returnArg(ctx.newContextVersion));
    sinon.stub(ctx.newContextVersion, 'fetchFile', returnArg(ctx.newContextVersion, dockerfile));

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
        sinon.assert.calledOnce(ctx.contextVersion.deepCopy);
        expect(readOnlySwitchController.readOnly(), 'readOnly').to.be.true;
        expect(keypather.get(readOnlySwitchController, 'state.simpleContextVersionCopy')).to.be.an.object;
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

      it('should switch revert back to the original context version when switching back to simple mode', function () {
        $scope.$emit = sinon.spy(function (eventName, contextVersion) {
          readOnlySwitchController.state.contextVersion = ctx.thirdContextVersion;
        });

        var simpleCVId = keypather.get(readOnlySwitchController, 'state.contextVersion.attrs._id');
        readOnlySwitchController.state.advanced = false;
        expect(simpleCVId).to.be.a.string;

        // Switch to advanced mode
        readOnlySwitchController.readOnly(true);
        $scope.$digest();
        var advancedCVId = keypather.get(readOnlySwitchController, 'state.contextVersion.attrs._id');
        var simpleCVCopy = keypather.get(readOnlySwitchController, 'state.simpleContextVersionCopy.attrs._id');
        // We will only modify the current CV and create a copy of it
        expect(advancedCVId).to.equal(simpleCVId);
        expect(simpleCVCopy).to.not.equal(simpleCVId);
        expect(keypather.get(readOnlySwitchController, 'state.advanced')).to.equal(true);

        // Switch back to simple mode with a new context version
        readOnlySwitchController.readOnly(false);
        $scope.$digest();
        var newSimpleCVId = keypather.get(readOnlySwitchController, 'state.contextVersion.attrs._id');
        expect(newSimpleCVId).to.not.equal(simpleCVId);
        // `resetStateContextVersion` should deepCopy our stored copy
        expect(simpleCVCopy).to.not.equal(newSimpleCVId);
        expect(keypather.get(readOnlySwitchController, 'state.advanced')).to.equal(false);
      });

    });

  });

  describe('rollback'.blue, function () {

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
