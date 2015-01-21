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

describe('modalStackDependencies'.bold.underline.blue, function () {
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

    ctx.template = directiveTemplate.attribute('modal-stack-dependencies', {
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
    it('should have working watchers', function () {
      expect(keypather.get($elScope, 'addDependencyPopover.data.dependencies')).to.not.be.ok;
      expect(keypather.get($elScope, 'addDependencyPopover.data.instances'))
          .to.equal($scope.data.instances);
      expect(keypather.get($elScope, 'addDependencyPopover.data.state.dependencies')).to.not.be.ok;

      $scope.data.allDependencies = {
        models: [{
          attrs: {
            name: 'mongodb'
          }
        }, {
          attrs: {
            name: 'redis'
          }
        }, {
          attrs: {
            name: 'cheese'
          }
        }]
      };
      $scope.$digest();
      expect($elScope.addDependencyPopover.data.dependencies).to.equal($scope.data.allDependencies);
      $scope.state.dependencies = [{
        instance: {
          attrs: {
            name: 'mongodb'
          }
        }
      }];
      $scope.$digest();
      expect($elScope.addDependencyPopover.data.state.dependencies)
          .to.equal($scope.state.dependencies);

      $scope.$destroy();
      $scope.$digest();
    });
  });
});
