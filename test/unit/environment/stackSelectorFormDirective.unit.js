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

function makeDefaultScope() {
  return {
    data: {
      instances: [apiMocks.instances.building, apiMocks.instances.running],
      activeAccount: ctx.fakeuser,
      orgs: {models: [ctx.fakeOrg1, ctx.fakeOrg2]},
      user: ctx.fakeuser
    },
    state: {
      selectedStack: {
        hello: 'chicken'
      }
    }
  };
}
// Skipping for now, component doesn't exist
// Address complaints to Nate
describe.only('stackSelectorForm'.bold.underline.blue, function () {
  beforeEach(function() {
    ctx = {};
  });
  function injectSetupCompile(addToScope) {
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

    angular.extend($scope, makeDefaultScope());
    if (addToScope) {
      angular.extend($scope, addToScope);
    }
    ctx.template = directiveTemplate.attribute('stack-selector-form', {
      'data': 'data',
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
      expect($elScope.state).to.be.ok;
      expect($elScope.state.selectedStack).to.be.ok;
      expect($elScope.temp).to.be.ok;
      expect($elScope.temp.stack).to.not.equal($elScope.state.selectedStack);
      expect($elScope.temp.stack).to.deep.equal($elScope.state.selectedStack);

      $scope.$destroy();
      $scope.$digest();
    });

    it('should set selectedStack to new value of temp', function () {

      $elScope.temp.stack = { asdasd: 'dfasdfasdf' };
      $scope.$digest();
      expect($elScope.temp.stack).to.deep.equal($elScope.state.selectedStack);

      $scope.$destroy();
      $scope.$digest();
    });

    it('should not allow stack to be set to null after', function () {

      $elScope.temp.stack = null;
      $scope.$digest();
      expect($elScope.temp.stack).to.not.equal($elScope.state.selectedStack);
      expect($elScope.state.selectedStack).to.deep.equal({
        hello: 'chicken'
      });
      expect($elScope.temp.stack).to.not.be.ok;

      $scope.$destroy();
      $scope.$digest();
    });
  });
});
