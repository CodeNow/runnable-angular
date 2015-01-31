var mockFetch = require('../fixtures/mockFetch');

describe.skip('directiveExplorer'.bold.underline.blue, function () {
  var ctx;
  var stateParams = {};

  var $scope,
      $elScope;

  beforeEach(function() {
    angular.mock.module('app');
    angular.mock.module(function($provide) {
      $provide.value('$stateParams', stateParams);
      $provide.value('fetch', mockFetch.fetch);
    });
    angular.mock.module(function($compileProvider) {
      $compileProvider.directive('fileTree', function() {
        return {
          priority: 9999,
          terminal: true,
          restrict: 'E',
          template: '<div></div>'
        };
      });
    });

    angular.mock.inject(function($compile, $rootScope, $q) {
      $scope = $rootScope.$new();
      mockFetch.init($q);

      stateParams.buildId = null;

      $scope.openItems = {};
      $scope.toggleTheme = false;

      ctx = {};
      ctx.template = directiveTemplate('explorer', {
        'open-items': 'openItems',
        'toggle-theme': 'toggleTheme'
      });
      ctx.element = $compile(ctx.template)($scope);
    });
  });

  it('sets the scope build', function() {
    mockFetch.expectFetch('build', 42, {a: 'b'});
    stateParams.buildId = 42;
    $scope.$digest();
    $elScope = ctx.element.isolateScope();

    expect($elScope.build).to.deep.equal({a: 'b'});
  });

  it('sets the scope instance', function() {
    mockFetch.expectFetch('instance', 42, {build: 'b'});
    $scope.$digest();
    $elScope = ctx.element.isolateScope();

    expect($elScope.instance).to.deep.equal({build: 'b'});
    expect($elScope.build).to.equal('b');
  });
});