'use strict';

// injector-provided
var $rootScope,
  $scope,
  $compile,
  keypather,
  $templateCache;
var $elScope;
var thisUser;

var apiMocks = require('../../../apiMocks/index');
var ctx;

var stacks = angular.copy(apiMocks.stackInfo);

function makeDefaultScope() {
  return {
    data: {
      instances: [apiMocks.instances.building, apiMocks.instances.running],
      activeAccount: ctx.fakeuser,
      orgs: {models: [ctx.fakeOrg1, ctx.fakeOrg2]},
      user: ctx.fakeuser,
    },
    actions: {
      addDependency: sinon.spy(),
      removeDependency: sinon.spy(),
      changeStep: sinon.spy(),
      nextStep: sinon.spy(),
      skipTutorial: sinon.spy(),
      createAndBuild: sinon.spy()
    },
    state: {
      things: {}
    }
  };
}

describe('modalStackSelector'.bold.underline.blue, function () {
  beforeEach(function() {
    ctx = {};
  });
  function injectSetupCompile() {
    angular.mock.module('app', function ($provide) {
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

    var scope = makeDefaultScope();
    Object.keys(scope).forEach(function (key) {
      $scope[key] = scope[key];
    });
    $scope.user = thisUser;

    ctx.template = directiveTemplate.attribute('modal-stack-selector', {
      'data': 'data',
      'actions': 'actions',
      'state': 'state'
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
      expect($elScope.data).to.be.ok;
      // Actions was modified, so just verify it exists
      expect($elScope.actions).to.be.ok;
      expect($elScope.actions.addDependency).to.be.a('function');
      expect($elScope.state).to.be.ok;


      $scope.$destroy();
      $scope.$digest();
    });
    it('should react to a stack change', function () {
      expect(keypather.get($elScope, 'state.startCommand')).to.not.be.ok;
      expect(keypather.get($elScope, 'state.ports')).to.not.be.ok;

      $elScope.state.stack = stacks[0];
      $scope.$digest();

      expect(keypather.get($elScope, 'state.startCommand')).to.equal(stacks[0].startCommand);
      expect(keypather.get($elScope, 'state.ports')).to.equal(stacks[0].ports);

      $scope.$destroy();
      $scope.$digest();
    });
  });
});
