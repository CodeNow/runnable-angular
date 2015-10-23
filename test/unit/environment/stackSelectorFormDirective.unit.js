'use strict';

// injector-provided
var $rootScope,
    $scope,
    $compile,
    keypather,
    $templateCache;
var $elScope;

var apiMocks = require('../apiMocks/index');
var ctx;

var stacks = angular.copy(apiMocks.stackInfo);
var MockFetch = require('../fixtures/mockFetch');

function makeDefaultScope() {
  return {
    state: {
      selectedStack: {
        key: 'chicken'
      }
    }
  };
}
describe('stackSelectorForm'.bold.underline.blue, function () {
  beforeEach(function() {
    ctx = {};
  });
  function injectSetupCompile(addToScope) {
    ctx.createDockerfileFromSourceMock = new MockFetch();
    ctx.updateDockerfileFromStateMock = sinon.spy();
    ctx.dockerfile = {
      attrs: apiMocks.files.dockerfile
    };
    ctx.contextVersion = apiClientMockFactory.contextVersion(
      runnable,
      apiMocks.contextVersions.running
    );
    ctx.fetchStackInfo = [
      {
        key: 'chicken',
        value: 'cooked'
      },
      {
        key: 'bbq',
        value: 'cooked chicken with sauce'
      }
    ];
    angular.mock.module('app', function ($provide) {
      $provide.factory('createDockerfileFromSource', ctx.createDockerfileFromSourceMock.fetch());
      $provide.factory('updateDockerfileFromState', function () {
        return ctx.updateDockerfileFromStateMock;
      });
      $provide.factory('fetchStackInfo', function ($q) {
        ctx.mockFetchStackInfo = sinon.stub().returns($q.when(ctx.fetchStackInfo));
        return ctx.mockFetchStackInfo;
      });
    });

    angular.mock.inject(function (
      _$templateCache_,
      _$compile_,
      _keypather_,
      _$rootScope_
    ) {
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      keypather = _keypather_;
      $compile = _$compile_;
      $templateCache = _$templateCache_;
    });

    angular.extend($scope, makeDefaultScope());
    if (addToScope) {
      angular.extend($scope, addToScope);
    }
    ctx.template = directiveTemplate.attribute('stack-selector-form', {
      'state': 'state',
      'loading-promises-target': 'hello'
    });

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  describe('Check that the directive added what it needs to the scope', function () {
    beforeEach(function () {
      injectSetupCompile();
    });
    it('should have everything on the scope that was given', function () {
      // Actions was modified, so just verify it exists
      sinon.assert.calledOnce(ctx.mockFetchStackInfo);
      expect($elScope.stacks).to.equal(ctx.fetchStackInfo);
      expect($elScope.state).to.be.ok;
      expect($elScope.state.selectedStack).to.be.ok;
      expect($elScope.temp).to.be.ok;
      expect($elScope.temp.stackKey).to.deep.equal($elScope.state.selectedStack.key);

      expect($elScope.loadingPromisesTarget).to.equal('hello');
    });

    it('should set selectedStack to new value of temp', function () {
      $elScope.temp.stackKey = 'bbq';
      $scope.$digest();
      expect($elScope.state.selectedStack.key).to.equal('bbq');
    });

    it('should not allow stack to be set to null after', function () {
      $elScope.temp.stackKey = null;
      $scope.$digest();
      expect($elScope.state.selectedStack.key).to.equal('chicken');
    });

    it('should create a new dockerfile, then update it, when a new stack is selected', function () {
      $scope.state.contextVersion = ctx.contextVersion;

      $elScope.temp.stackKey = 'bbq';
      $scope.$digest();
      sinon.assert.calledOnce(ctx.createDockerfileFromSourceMock.getFetchSpy());
      sinon.assert.calledWith(ctx.createDockerfileFromSourceMock.getFetchSpy(), ctx.contextVersion, 'bbq');

      ctx.createDockerfileFromSourceMock.triggerPromise(ctx.dockerfile);
      $scope.$digest();
      expect($elScope.state.dockerfile).to.equal(ctx.dockerfile);
      sinon.assert.calledOnce(ctx.updateDockerfileFromStateMock);
      sinon.assert.calledWith(ctx.updateDockerfileFromStateMock, $elScope.state);
    });

    it('should wait for the createDockerfile before updating the dockerfile', function () {
      $scope.state.contextVersion = ctx.contextVersion;

      $elScope.temp.stackKey = 'bbq';
      $elScope.updateDockerfile();
      sinon.assert.notCalled(ctx.updateDockerfileFromStateMock);
      $scope.$digest();

      ctx.createDockerfileFromSourceMock.triggerPromise(ctx.dockerfile);
      $scope.$digest();
      sinon.assert.calledOnce(ctx.createDockerfileFromSourceMock.getFetchSpy());
      sinon.assert.calledWith(ctx.createDockerfileFromSourceMock.getFetchSpy(), ctx.contextVersion, 'bbq');
      expect($elScope.state.dockerfile, 'dockerfile').to.equal(ctx.dockerfile);
      sinon.assert.calledTwice(ctx.updateDockerfileFromStateMock);
      sinon.assert.calledWith(ctx.updateDockerfileFromStateMock, $elScope.state);
    });
  });
});
