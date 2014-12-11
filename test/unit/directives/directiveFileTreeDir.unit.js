describe('directiveFileTreeDir'.bold.underline.blue, function () {
  var element;
  var $elScope;
  var $scope;
  var keypather;

  var mockDir = {};
  var mockOpenItems = {};
  var mockBuild = {};

  function initState() {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('$state', {
        '$current': {
          name: 'instance.setup'
        }
      });
    });
    angular.mock.inject(function($compile, $rootScope, _keypather_){
      $scope = $rootScope.$new();
      keypather = _keypather_;

      $scope.mockDir = mockDir;
      $scope.mockOpenItems = mockOpenItems;
      $scope.mockBuild = mockBuild;

      var template = directiveTemplate('file-tree-dir', {
        'dir': 'mockDir',
        'open-items': 'mockOpenItems',
        'read-only': 'true',
        'build': 'mockBuild'
      });
      element = angular.element(template);
      element = $compile(element)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  }
  beforeEach(initState);
  it('directory refetches files on state:instance.setup when source context version changes', function () {
    keypather.set($scope, '$$childHead.dir.contents.fetch', function () {});
    sinon.spy($scope.$$childHead.dir.contents, 'fetch');
    keypather.set($scope.$$childHead, 'build.contextVersions.models[0].source', Math.random());
    $scope.$digest();
    expect($scope.$$childHead.dir.contents.fetch.called).to.equal(true);
  });
});
