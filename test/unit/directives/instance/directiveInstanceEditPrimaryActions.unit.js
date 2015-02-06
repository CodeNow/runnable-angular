'use strict';

// injector-provided
var $rootScope,
    $scope,
    async,
    $state,
    $compile,
    $timeout,
    errs,
    $q,
    $stateParams;
var $elScope;
var thisUser;

var apiMocks = require('../../apiMocks/index');

function makeDefaultScope () {
  return {
    instance: {
      attrs: angular.copy(apiMocks.instances.building)
    },
    loading: false,
    openItems: {
      isClean: function () {
        return false;
      }
    },
    unsavedAcvs: []
  };
}


describe('directiveInstanceEditPrimaryActions'.bold.underline.blue, function() {
  var ctx;
  function injectSetupCompile(scope) {
    angular.mock.module('app');
    var stateMock = {
      '$current': {
        name: 'instance.instanceEdit'
      },
      go: function () {}
    };
    ctx = {};
    ctx.errs = {
      handler: sinon.spy()
    };
    ctx.fetchBuild = sinon.spy(function () {
      var d = $q.defer();
      if (ctx.fetchBuildFail) {
        d.reject(ctx.errMessage);
      } else {
        d.resolve(ctx.mockBuild);
      }
      return d.promise;
    });
    angular.mock.module(function ($provide) {
      $provide.value('$state', stateMock);

      $provide.value('$stateParams', {
        userName: 'username',
        buildId: '54668070531ae50e002c8503',
        instanceName: 'instancename'
      });
      $provide.value('fetchBuild', ctx.fetchBuild);
      $provide.value('errs', ctx.errs);
    });
    angular.mock.inject(function (
      //_async_,
      _$state_,
      _$stateParams_,
      _$rootScope_,
      _$compile_,
      _errs_,
      _$timeout_,
      _$q_,
      user
    ) {
      $q = _$q_;
      thisUser = user;
      thisUser.reset(apiMocks.user);
      $timeout = _$timeout_;
      $compile = _$compile_;
      errs = _errs_;
      $rootScope = _$rootScope_;
      $state = _$state_;
      $stateParams = _$stateParams_;

      $scope = _$rootScope_.$new();

    });
    if (scope) {
      Object.keys(scope).forEach(function (key) {
        $scope[key] = scope[key];
      });
    }
    $scope.user = thisUser;

    modelStore.reset();

    ctx.stateMock = stateMock;
    ctx.template = directiveTemplate('instance-edit-primary-actions', {
      user: 'user',
      instance: 'instance',
      loading: 'loading',
      'unsaved-acvs': 'unsavedAcvs',
      'open-items': 'openItems'
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();

    ctx.mockBuild = {
      attrs: angular.copy(apiMocks.builds.setup)
    };
    ctx.mockBuild2 = {
      attrs: angular.copy(apiMocks.instances.build)
    };

    ctx.instanceUpdateCalled = false;
    ctx.buildBuildCalled = false;
    ctx.dockerfileUpdateCalled = false;

    ctx.mockBuild.build = function (buildOpts, cb) {
      ctx.buildBuildCalled = true;
      expect(buildOpts.message).to.equal('Manual build');
      cb(null, ctx.mockBuild);
    };
    ctx.mockBuild.id = function () {
      return this._id;
    };
    ctx.dockerfile = {
      attrs: apiMocks.files.dockerfile,
      update: function (body, cb) {
        expect(body).to.deep.equal({
          json: {
            body: apiMocks.files.dockerfile.body
          }
        });
        ctx.dockerfileUpdateCalled = true;
        cb();
      }
    };
    ctx.mockBuild.contexts = {
      models: [{
        createVersion: sinon.spy(function(body, cb) {
          cb();
        })
      }]
    };
    ctx.mockBuild.contextVersions = {
      models: [{
        attrs: apiMocks.contextVersions.running,
        rootDir: {
          contents: [ctx.dockerfile]
        },
        appCodeVersions: {
          create: sinon.spy()
        },
        id: function() {
          return 213423;
        }
      }]
    };
    $scope.instance.update = function (opts, cb) {
      ctx.instanceUpdateCalled = true;
      expect(opts).to.deep.equal({ build: ctx.mockBuild._id});
      cb();
    };

  }
  describe('Check that the directive added what it needs to the scope', function() {
    var inputScope;
    beforeEach(function () {
      inputScope = makeDefaultScope();
      injectSetupCompile(inputScope);
    });
    it('should fail without a user on the scope', function() {
      expect($elScope.user).to.equal(thisUser);
      expect($elScope.instance).to.equal(inputScope.instance);
      expect($elScope.loading).to.equal(inputScope.loading);
      expect($elScope.openItems).to.equal(inputScope.openItems);
      expect($elScope.popoverBuildOptions).to.be.ok;
      expect($elScope.popoverBuildOptions.data).to.be.ok;
      expect($elScope.popoverBuildOptions.actions).to.be.ok;
      expect($elScope.popoverBuildOptions.actions.noCacheBuild).to.be.ok;
      expect($elScope.newBuild).to.be.undefined;
    });
  });

  describe('Building', function() {
    var inputScope, isClean;
    // Things to test
    //    double building
    //    check loading
    //    cache/noCache
    //    verify no building until openItems.clean
    beforeEach(function () {
      inputScope = makeDefaultScope();
      isClean = true;
      inputScope.openItems.isClean = function () {
        return isClean;
      };
      injectSetupCompile(inputScope);
    });
    it('shouldn\'t build if openItems isn\'t clean', function () {
      isClean = false;
      $scope.$digest();
      $elScope.build();
      $scope.$digest();
      expect($elScope.loading).to.equal(true);
    });

    it('should build if openItems is clean', function (done) {
      // Set up mocking
      ctx.stateMock.go = function (newState) {
        expect(newState).to.equal('instance.instance');
        expect(ctx.instanceUpdateCalled).to.be.true;
        expect(ctx.buildBuildCalled).to.be.true;
        expect(ctx.dockerfileUpdateCalled).to.be.false;
        done();
      };

      // Now do it
      $scope.$digest();
      $elScope.build();
      $scope.$digest();
      expect($elScope.loading).to.equal(true);
    });

    it('should update the envs of the instance if they are on the state', function (done) {
      // Set up mocking
      ctx.stateMock.go = function (newState) {
        expect(newState).to.equal('instance.instance');
        expect(ctx.instanceUpdateCalled).to.be.true;
        expect(ctx.buildBuildCalled).to.be.true;
        done();
      };
      $scope.instance.state = {
        env: ['aas=asdasdas']
      };
      $scope.instance.update = function (opts, cb) {
        ctx.instanceUpdateCalled = true;
        expect(opts).to.deep.equal({
          build: ctx.mockBuild._id,
          env: ['aas=asdasdas']
        });
        cb();
      };

      // Now do it
      $scope.$digest();
      $elScope.build();
      $scope.$digest();
      expect($elScope.loading).to.equal(true);
    });

    it('should cause a file update when doing noCache', function (done) {
      // Set up mocking
      ctx.stateMock.go = function (newState) {
        expect(newState).to.equal('instance.instance');
        expect(ctx.instanceUpdateCalled).to.be.true;
        expect(ctx.buildBuildCalled).to.be.true;
        done();
      };
      // Now do it
      $scope.$digest();
      $elScope.popoverBuildOptions.actions.noCacheBuild();
      $scope.$digest();
      expect($elScope.loading).to.equal(true);
    });

    it('should not try to build twice', function (done) {
      // Set up mocking
      var fetchBuildCount = 0;
      ctx.stateMock.go = function (newState) {
        expect(newState).to.equal('instance.instance');
        expect(ctx.instanceUpdateCalled).to.be.true;
        expect(ctx.buildBuildCalled).to.be.true;
        expect(ctx.dockerfileUpdateCalled).to.be.false;
        sinon.assert.calledOnce(ctx.fetchBuild);
        done();
      };
      // Now do it
      $scope.$digest();
      $elScope.build();
      $scope.$digest();
      $elScope.build();
      $scope.$digest();
      expect($elScope.loading).to.equal(true);
    });
  });


  describe('Testing Failures', function () {
    var inputScope;
    var fakeErr;
    beforeEach(function () {
      inputScope = makeDefaultScope();
      inputScope.openItems.isClean = function () {
        return true;
      };
      injectSetupCompile(inputScope);
    });

    it('should throw an error if the fetching the build failed', function() {
      // Set up mocking
      ctx.errMessage = 'failed to fetch build';
      ctx.fetchBuildFail = true;
      function doStuff () {
        $elScope.build();
        $scope.$digest();
      }
      $scope.$digest();

      doStuff();
      sinon.assert.called(ctx.errs.handler);
      // Now do it
      expect($elScope.loading).to.equal(false);
      expect(ctx.instanceUpdateCalled).to.be.false;
      expect(ctx.buildBuildCalled).to.be.false;
    });

    it('should throw an error if the building the build failed', function() {
      // Set up mocking
      var errorMessage = 'failed to build';
      ctx.mockBuild.build = function (message, cb) {
        ctx.buildBuildCalled = true;
        cb(new Error(errorMessage), ctx.mockBuild);
      };
      function doStuff () {
        $elScope.build();
        $scope.$digest();
      }
      $scope.$digest();

      doStuff();
      sinon.assert.called(ctx.errs.handler);
      // Now do it
      expect($elScope.loading).to.equal(false);
      expect(ctx.instanceUpdateCalled).to.be.false;
      expect(ctx.buildBuildCalled).to.be.true;
    });

    it('should throw an error if the instance update failed', function() {
      // Set up mocking
      var errorMessage = 'failed to update instance';

      $scope.instance.update = function (opts, cb) {
        ctx.instanceUpdateCalled = true;
        expect(opts).to.deep.equal({ build: ctx.mockBuild._id});
        cb(new Error(errorMessage));
      };
      function doStuff () {
        $elScope.build();
        $scope.$digest();
      }
      $scope.$digest();

      doStuff();
      sinon.assert.called(ctx.errs.handler);
      // Now do it
      expect($elScope.loading).to.equal(false);
      expect(ctx.instanceUpdateCalled).to.be.true;
      expect(ctx.buildBuildCalled).to.be.true;
    });
  });
});
