'use strict';

// injector-provided
var $rootScope,
  $scope,
  $compile;
var $elScope;
var thisUser;

var apiMocks = require('../../apiMocks/index');

function makeDefaultScope () {
  return {
    data: {
      instance: apiMocks.instances.building,
      instances: [apiMocks.instances.building, apiMocks.instances.running]
    },
    currentModel: apiMocks.instances.building,
    stateModel: {}
  };
}

describe('directiveSetupSecondaryActions'.bold.underline.blue, function () {
  var ctx;
  function injectSetupCompile(scope) {
    angular.mock.module('app');
    angular.mock.inject(function (
      _$rootScope_,
      _$timeout_,
      _$compile_
    ) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $scope = _$rootScope_.$new();
    });
    if (scope) {
      Object.keys(scope).forEach(function (key) {
        $scope[key] = scope[key];
      });
    }
    $scope.user = thisUser;

    ctx = {};
    ctx.template = directiveTemplate('setup-secondary-actions', {
      'data': 'data',
      'current-model': 'currentModel',
      'state-model': 'stateModel'
    });

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
      expect($elScope.currentModel).to.deep.equal($scope.currentModel);
      expect($elScope.stateModel).to.deep.equal($scope.stateModel);
      expect($elScope.actions).to.deep.equal({});
      $scope.$destroy();
      $scope.$digest();
    });
  });
});
