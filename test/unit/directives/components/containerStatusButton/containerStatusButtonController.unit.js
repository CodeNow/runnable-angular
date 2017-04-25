'use strict';

var $controller,
  $rootScope,
  $scope;
var keypather;
var $q;
var CSBC;
var apiMocks = require('./../../../apiMocks/index');
var redeployClusterMasterInstanceStub;

describe('containerStatusButtonController'.bold.underline.blue, function () {
  var ctx;
  var mockInstance;
  var mockUpdateInstanceWithNewBuild;
  var promisifyMock;
  var mockMainACV;

  beforeEach(function () {
    ctx = {};
  });

  beforeEach(function () {
    mockUpdateInstanceWithNewBuild = sinon.stub();
    ctx.errsMock = {
      handler: sinon.spy()
    };
    ctx.loadingMock = sinon.spy();
    angular.mock.module('app', function ($provide) {
      $provide.value('errs', ctx.errsMock);
      $provide.value('loading', ctx.loadingMock);
      $provide.value('updateInstanceWithNewBuild', mockUpdateInstanceWithNewBuild);
      $provide.factory('promisify', function ($q) {
        promisifyMock = sinon.spy(function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyMock;
      });
      $provide.factory('redeployClusterMasterInstance', function ($q) {
        redeployClusterMasterInstanceStub = sinon.stub().returns($q.when({}));
        return redeployClusterMasterInstanceStub
      });
    });
    angular.mock.inject(function (
      _$controller_,
      _$q_,
      _$rootScope_,
      _$timeout_,
      _keypather_
    ) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $controller = _$controller_;
      $q = _$q_;
      keypather = _keypather_;

      mockMainACV = {
        attrs: {
          mainACVAttrs: true
        }
      };
      mockInstance = {
        restart: sinon.spy(),
        fetch: sinon.spy(),
        status: sinon.stub().returns('running'),
        stop: sinon.spy(),
        start: sinon.spy(),
        build: {
          deepCopy: sinon.spy()
        },
        contextVersion: {
          getMainAppCodeVersion: sinon.stub().returns(mockMainACV)
        }
      };

      var laterController = $controller('ContainerStatusButtonController', {
        $scope: $scope
      }, true);
      laterController.instance.instance = mockInstance;
      CSBC = laterController();
    });
  });

  describe('doesMatchMasterPod', function () {
    it('should return true if fulfilled is false', function () {
      mockInstance.doesMatchMasterPod = sinon.stub().returns({
        isFulfilled: sinon.stub().returns(false),
        value: sinon.stub().returns(new Error('NO')),
        then: sinon.stub().returns()
      });
      $scope.$digest();
      expect(CSBC.doesMatchMasterPod()).to.be.true;
    });
    it('should return true if true', function () {
      mockInstance.doesMatchMasterPod = sinon.stub().returns({
        isFulfilled: sinon.stub().returns(true),
        value: sinon.stub().returns(true)
      });
      $scope.$digest();
      expect(CSBC.doesMatchMasterPod()).to.be.true;
    });
    it('should return false if false', function () {
      mockInstance.doesMatchMasterPod = sinon.stub().returns({
        isFulfilled: sinon.stub().returns(true),
        value: sinon.stub().returns(false)
      });
      $scope.$digest();
      expect(CSBC.doesMatchMasterPod()).to.be.false;
    });
  });

  describe('popoverStatusOptions', function () {
    var closePopoversListener;
    describe('actions', function () {
      beforeEach(function () {
        closePopoversListener = sinon.spy();
        $scope.$on('close-popovers', closePopoversListener);
      });

      it('should allow the user to stop the instance', function () {
        CSBC.actions.stopInstance();
        $scope.$digest();
        sinon.assert.calledOnce(CSBC.instance.stop);
        sinon.assert.calledOnce(closePopoversListener);
      });

      it('should allow the user to start the instance', function () {
        CSBC.actions.startInstance();
        $scope.$digest();
        sinon.assert.calledOnce(CSBC.instance.start);
        sinon.assert.calledOnce(closePopoversListener);
      });

      it('should allow the user to restart the instance', function () {
        CSBC.actions.restartInstance();
        $scope.$digest();
        sinon.assert.calledOnce(CSBC.instance.restart);
        sinon.assert.calledOnce(closePopoversListener);
      });

      it('should allow the user to build without cache', function () {
        CSBC.actions.rebuildWithoutCache();
        $scope.$digest();
        sinon.assert.calledWith(ctx.loadingMock, 'main', true);
        sinon.assert.calledWith(ctx.loadingMock, 'main', false);
        sinon.assert.calledOnce(CSBC.instance.build.deepCopy);
        sinon.assert.calledOnce(mockUpdateInstanceWithNewBuild);
        sinon.assert.calledOnce(closePopoversListener);
      });

      it('should allow the user to build without cache from a child test container in isolation', function () {
        keypather.set(CSBC.instance, 'isolation.groupMaster.attrs.isTesting', true);
        var buildDeepCopy = sinon.stub();
        keypather.set(CSBC.instance, 'isolation.groupMaster.build.deepCopy', buildDeepCopy);
        CSBC.actions.rebuildWithoutCache();
        $scope.$digest();
        sinon.assert.calledWith(ctx.loadingMock, 'main', true);
        sinon.assert.calledWith(ctx.loadingMock, 'main', false);
        sinon.assert.notCalled(CSBC.instance.build.deepCopy);
        sinon.assert.calledOnce(buildDeepCopy);
        sinon.assert.calledOnce(mockUpdateInstanceWithNewBuild);
        sinon.assert.calledOnce(closePopoversListener);
      });

      it('should allow the user to redeploy a test cluster', function () {
        keypather.set(CSBC.instance, 'attrs.id', 'runnable.rocks!');
        var $state
        CSBC.actions.redeployCluster();
        sinon.assert.calledWith(redeployClusterMasterInstanceStub, 'runnable.rocks!');
        sinon.assert.calledOnce(closePopoversListener);
      })

      it('should allow the user to update the configuration to match master', function () {
        var mainAcv = {
          args: {
            thisIsAttrs: true
          },
          update: sinon.spy()
        };
        var copiedCtxVersion = {
          fetch: sinon.spy(),
          getMainAppCodeVersion: sinon.stub().returns(mainAcv)
        };
        var buildDeepCopy = {
          contextVersions: {
            models: [copiedCtxVersion]
          },
          fetch: sinon.spy()
        };
        var masterInstance = {
          attrs: {
            env: 'env'
          },
          build: {
            deepCopy: sinon.stub().returns(buildDeepCopy)
          }
        };
        CSBC.instance.fetchMasterPod = sinon.stub().returns({models: [masterInstance]});
        $scope.$digest();
        CSBC.actions.updateConfigToMatchMaster();
        $scope.$digest();

        sinon.assert.calledWith(ctx.loadingMock, 'main', true);
        sinon.assert.calledWith(ctx.loadingMock, 'main', false);
        sinon.assert.calledOnce(closePopoversListener);
        sinon.assert.calledOnce(mainAcv.update);
        sinon.assert.calledWith(mainAcv.update, mockMainACV.attrs);
        sinon.assert.calledOnce(mockUpdateInstanceWithNewBuild);
        sinon.assert.calledWith(
          mockUpdateInstanceWithNewBuild,
          CSBC.instance,
          buildDeepCopy,
          true,
          { env: 'env' }
        );
      });
    });
  });

  describe('failures', function () {
    var closePopoversListener;
    beforeEach(function () {
      closePopoversListener = sinon.spy();
      $scope.$on('close-popovers', closePopoversListener);
    });
    it('should allow the user to stop the instance', function () {
      ctx.error = new Error('asdasd');
      CSBC.instance.stop = sinon.spy(function () {
        var d = $q.defer();
        d.reject(ctx.error);
        return d.promise;
      });
      CSBC.actions.stopInstance();
      $scope.$digest();
      sinon.assert.calledOnce(CSBC.instance.stop);
      sinon.assert.calledOnce(ctx.errsMock.handler);
      sinon.assert.calledOnce(closePopoversListener);
    });
    it('should call error handler when starting the instance', function () {
      CSBC.instance.start = sinon.spy(function () {
        var d = $q.defer();
        d.reject(ctx.error);
        return d.promise;
      });
      CSBC.actions.startInstance();
      $scope.$digest();
      sinon.assert.calledOnce(CSBC.instance.start);
      sinon.assert.calledOnce(ctx.errsMock.handler);
      sinon.assert.calledOnce(closePopoversListener);
    });
    it('sshould call error handler when restarting the instance', function () {
      CSBC.instance.restart = sinon.spy(function () {
        var d = $q.defer();
        d.reject(ctx.error);
        return d.promise;
      });
      CSBC.actions.restartInstance();
      $scope.$digest();
      sinon.assert.calledOnce(CSBC.instance.restart);
      sinon.assert.calledOnce(ctx.errsMock.handler);
      sinon.assert.calledOnce(closePopoversListener);
    });

    it('should call error handler when building without cache', function () {
      mockUpdateInstanceWithNewBuild.returns($q.reject(ctx.error));
      CSBC.actions.rebuildWithoutCache();
      $scope.$digest();
      sinon.assert.calledWith(ctx.loadingMock, 'main', true);
      sinon.assert.calledWith(ctx.loadingMock, 'main', false);
      sinon.assert.calledOnce(ctx.errsMock.handler);
      sinon.assert.calledOnce(CSBC.instance.build.deepCopy);
      sinon.assert.calledOnce(mockUpdateInstanceWithNewBuild);
      sinon.assert.calledOnce(closePopoversListener);
    });
    it('should call error handler when updating the configuration to match master', function () {
      var mainAcv = {
        args: {
          thisIsAttrs: true
        },
        update: sinon.spy(function () {
          var d = $q.defer();
          d.reject(ctx.error);
          return d.promise;
        })
      };
      var copiedCtxVersion = {
        fetch: sinon.spy(),
        getMainAppCodeVersion: sinon.stub().returns(mainAcv)
      };
      var buildDeepCopy = {
        contextVersions: {
          models: [copiedCtxVersion]
        },
        fetch: sinon.spy()
      };
      var masterInstance = {
        attrs: {
          env: 'env'
        },
        build: {
          deepCopy: sinon.stub().returns(buildDeepCopy)
        }
      };
      CSBC.instance.fetchMasterPod = sinon.stub().returns({models: [masterInstance]});
      $scope.$digest();
      CSBC.actions.updateConfigToMatchMaster();
      $scope.$digest();

      sinon.assert.calledWith(ctx.loadingMock, 'main', true);
      sinon.assert.calledOnce(closePopoversListener);
      sinon.assert.calledOnce(mainAcv.update);
      sinon.assert.calledWith(mainAcv.update, mockMainACV.attrs);

      // Failure happens here
      sinon.assert.calledOnce(ctx.errsMock.handler);
      sinon.assert.notCalled(mockUpdateInstanceWithNewBuild);
      sinon.assert.calledWith(ctx.loadingMock, 'main', false);
    });
  });
});
