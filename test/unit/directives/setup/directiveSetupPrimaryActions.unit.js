'use strict';

// injector-provided
var $rootScope,
  $scope,
  $compile,
  $state,
  $stateParams;
var $elScope;
var keypather;
var apiMocks = require('../../apiMocks/index');

function makeDefaultScope() {
  return {
    activeAccount: {
      oauthId: function () {
        return apiMocks.user.accounts.github.accessToken;
      }
    },
    data: {
      build: {
        attrs: angular.copy(apiMocks.builds.setup),
        id: function () {
          return apiMocks.builds.setup._id;
        }
      },
      user: angular.copy(apiMocks.user)
    },
    loading: false,
    name: 'hello',
    isNameValid: true,
    isDockerFileValid: true,
    openItems: {
      isClean: function () {
        return true;
      }
    },
    instanceOpts: {}
  };
}

describe('directiveSetupPrimaryActions'.bold.underline.blue, function () {
  var ctx;
  function injectSetupCompile(scope) {
    angular.mock.module('app');
    var stateMock = {
      '$current': {
        name: 'instance.instanceEdit'
      },
      go: function () {}
    };
    angular.mock.module(function ($provide) {
      $provide.value('$state', stateMock);
      $provide.value('$stateParams', {
        userName: 'username'
      });
    });
    angular.mock.inject(function (
      _$state_,
      _$stateParams_,
      _$rootScope_,
      _$timeout_,
      _$compile_,
      _keypather_
    ) {
      $state = _$state_;
      $stateParams = _$stateParams_;
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $scope = _$rootScope_.$new();
      keypather = _keypather_;
    });
    if (scope) {
      Object.keys(scope).forEach(function (key) {
        $scope[key] = scope[key];
      });
    }
    keypather.set($rootScope, 'dataApp.data.instances.create', sinon.spy(function (opts, cb) {
      cb();
    }));

    ctx = {};
    ctx.template = directiveTemplate('setup-primary-actions', {
      'active-account': 'activeAccount',
      'data': 'data',
      'loading': 'loading',
      'name': 'name',
      'is-name-valid': 'isNameValid',
      'is-docker-file-valid': 'isDockerFileValid',
      'open-items': 'openItems',
      'instance-opts': 'instanceOpts'
    });
    ctx.stateMock = stateMock;
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  describe('Check that the directive added what it needs to the scope', function () {
    beforeEach(function () {
      injectSetupCompile(makeDefaultScope());
    });
    it('should have everything on the scope that was given', function () {
      expect($elScope.data).to.deep.equal($scope.data);
      expect($elScope.loading).to.deep.equal($scope.loading);
      expect($elScope.name).to.deep.equal($scope.name);
      expect($elScope.isNameValid).to.deep.equal($scope.isNameValid);
      expect($elScope.isDockerFileValid).to.deep.equal($scope.isDockerFileValid);
      expect($elScope.openItems).to.deep.equal($scope.openItems);
      expect($elScope.instanceOpts).to.deep.equal($scope.instanceOpts);
      $scope.$destroy();
      $scope.$digest();
    });
  });
  describe('Error Handling', function () {
    beforeEach(function () {
      injectSetupCompile(makeDefaultScope());
    });
    it('should throw an error if one happened during the build', function () {
      // Set up mocking
      var errorMessage = 'failed to build';
      $scope.data.build.build = function (message, cb) {
        cb(new Error(errorMessage));
      };
      function doStuff() {
        $scope.$digest();
        $elScope.buildAndAttach();
        $scope.$digest();
      }
      $scope.$digest();
      expect(doStuff).to.throw(errorMessage);
      // Now do it
      expect($elScope.loading).to.equal(true);
    });
  });
  describe('Building', function () {
    var inputScope, isClean;

    beforeEach(function () {
      inputScope = makeDefaultScope();
      isClean = true;
      inputScope.openItems.isClean = function () {
        return isClean;
      };
      injectSetupCompile(inputScope);
    });
    it('shouldn\'t build if openItems isn\'t clean', function () {
      var buildSpy = sinon.spy();
      $scope.data.build.build = buildSpy;
      isClean = false;
      $scope.$digest();
      $elScope.buildAndAttach();
      $scope.$digest();
      expect($elScope.loading).to.equal(true);
      expect(buildSpy.called).to.equal(false);
    });

    it('should build if openItems is clean', function (done) {
      keypather.set($rootScope, 'dataApp.data.instances.create', sinon.spy(function (opts, cb) {
        expect(opts.owner).to.deep.equal({
          github: apiMocks.user.accounts.github.accessToken
        });
        expect(opts.build).to.equal($scope.data.build.attrs._id);
        expect(opts.name).to.equal($scope.name);
        setTimeout(cb, 0);
        var copy = angular.copy(apiMocks.instances.building);
        copy.name = $scope.name;
        return { attrs: copy };
      }));

      ctx.stateMock.go = function (newState, params) {
        expect(newState).to.equal('instance.instance');
        expect(params.userName).to.equal($stateParams.userName);
        expect(params.instanceName).to.equal($scope.name);
        expect($elScope.loading).to.equal(false);
        done();
      };

      $scope.data.build.build = function (message, cb) {
        expect(message).to.deep.equal({
          message: 'Initial Build'
        });
        cb();
      };

      // Now do it
      $scope.$digest();
      $elScope.buildAndAttach();
      $scope.$digest();
      expect($elScope.loading).to.equal(true);
    });
  });
});
