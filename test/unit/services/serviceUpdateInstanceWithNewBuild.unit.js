'use strict';

// injector-provided
var $rootScope,
  $scope,
  $compile,
  $timeout,
  $document,
  $localStorage,
  $state,
  $templateCache;
var thisUser;
var keypather;
var theServiceToTest;

var deepCopyCb;
var buildBuildCb;
var contentsFetchCb;
var instanceUpdateCb;
var errs;

var openItemsIsClean = true;

var apiMocks = require('../apiMocks/index');


function createBuildObject(json) {
  return {
    attrs: angular.copy(json || apiMocks.builds.setup),
    deepCopy: sinon.spy(function (cb) {
      deepCopyCb = cb;
      return createBuildObject(apiMocks.builds.new);
    }),
    build: sinon.spy(function (opts, cb) {
      buildBuildCb = cb;
      return this;
    }),
    id: function () {
      return this.attrs._id;
    },
    contextVersions: {
      models: [
        {
          rootDir: {
            contents: {
              fetch: function (cb) {
                contentsFetchCb = cb;
              },
              models: [
                {
                  attrs: apiMocks.files.dockerfile
                }
              ]
            }
          },
          fetch: function (cb) {
            cb();
          }
        }
      ]
    }
  };
}
function makeDefaultScope(noInstance) {
  var opts = {
    data: {
      instance: {
        attrs: angular.copy(apiMocks.instances.building),
        update: sinon.spy(function (opts, cb) {
          instanceUpdateCb = cb;
          return;
        })
      },
      build: createBuildObject(),
      instances: {
        models: [
          {
            attrs: angular.copy(apiMocks.instances.building)
          },
          {
            attrs: angular.copy(apiMocks.instances.running)
          }
        ]
      }
    },
    actions: {
      close: sinon.spy(function (cb) {
        cb();
      })
    }
  };
  if (noInstance) {
    delete opts.data.instance;
  }
  return opts;
}

describe('updateInstanceWithNewBuild'.bold.underline.blue, function () {
  beforeEach(function () {

    deepCopyCb = null;
    buildBuildCb = null;
    contentsFetchCb = null;
    instanceUpdateCb = null;

    openItemsIsClean = true;
  });
  function injectSetupCompile() {
    errs = {
      handler: sinon.spy()
    };
    angular.mock.module('app', function ($provide) {
      $provide.value('eventTracking', {
        triggeredBuild: sinon.spy()
      });
      $provide.value('errs', errs);
    });
    angular.mock.inject(function (
      _$templateCache_,
      _$localStorage_,
      _$compile_,
      _$timeout_,
      _$document_,
      _updateInstanceWithNewBuild_,
      _keypather_,
      _$state_,
      _$rootScope_
    ) {
      $rootScope = _$rootScope_;
      $state = _$state_;
      keypather = _keypather_;
      theServiceToTest = _updateInstanceWithNewBuild_;
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
      $timeout = _$timeout_;
      $localStorage = _$localStorage_;
      $document = _$document_;
      $templateCache = _$templateCache_;
    });
    $scope.$digest();
  }
  describe('basic functionality', function () {
    beforeEach(injectSetupCompile);
    it('should build successfully', function () {
      var goStub = sinon.stub($state, 'go');
      var state = {};
      var scope = makeDefaultScope();
      scope.build = createBuildObject();
      keypather.set(state, 'env', {
        hello: 'hello'
      });
      keypather.set(state, 'name', 'Cheeseburgers');

      scope.building = true;
      theServiceToTest(scope.data.instance, scope.build, false, state, scope, scope.actions);
      $scope.$digest();

      expect(buildBuildCb, 'buildBuildCb').to.be.ok;
      buildBuildCb();
      $scope.$digest();

      expect(instanceUpdateCb, 'instanceUpdateCb').to.be.ok;
      instanceUpdateCb();
      var instanceUpdateCall = scope.data.instance.update.getCall(0);
      expect(instanceUpdateCall.args[0], 'instance update 1st arg').to.deep.equal({
        env: {
          hello: 'hello'
        },
        name: 'Cheeseburgers',
        build: scope.build.id()
      });
      $scope.$digest();

      expect(scope.building, 'building').to.be.false;
      sinon.assert.calledOnce(scope.actions.close);
      $scope.$digest();

      $timeout.flush();
      $scope.$digest();

      expect($state.go.calledWith('instance.instance', {
        instanceName: 'Cheeseburgers'
      }), 'Called instance').to.equal(true);

      $scope.$destroy();
      $scope.$digest();
    });

    it('should build successfully as normal, no redirect', function () {
      var goStub = sinon.stub($state, 'go');
      var state = {};
      var scope = makeDefaultScope();
      scope.build = createBuildObject();
      scope.building = true;

      theServiceToTest(scope.data.instance, scope.build, true, state, scope, scope.actions);
      $scope.$digest();

      expect(buildBuildCb, 'buildBuildCb').to.be.ok;
      buildBuildCb();
      var buildBuildCall = scope.build.build.getCall(0);
      expect(buildBuildCall.args[0], 'build build 1st arg').to.deep.equal({
        message: 'Manual build',
        noCache: true
      });
      $scope.$digest();

      expect(instanceUpdateCb, 'instanceUpdateCb').to.be.ok;
      instanceUpdateCb();
      var instanceUpdateCall = scope.data.instance.update.getCall(0);
      expect(instanceUpdateCall.args[0], 'instance update 1st arg').to.deep.equal({
        build: scope.build.id()
      });
      $timeout.flush();

      expect(scope.building, 'building').to.be.false;
      sinon.assert.calledOnce(scope.actions.close);
      $scope.$digest();

      $timeout.verifyNoPendingTasks();
      $scope.$digest();

      sinon.assert.notCalled($state.go);

      $scope.$destroy();
      $scope.$digest();
    });
  });
});
