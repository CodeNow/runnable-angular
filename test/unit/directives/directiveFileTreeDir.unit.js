'use strict';

describe('directiveFileTreeDir'.bold.underline.blue, function () {
  var element;
  var $scope;
  var keypather;

  var mockDir = {};
  var mockOpenItems = {};
  var mockBuild = {};

  beforeEach(angular.mock.module('app'));

  // split into helper function, to be called
  // from each test block. $provide.value must
  // be set before angular.mock.inject
  //
  // This way each test can set values for $state,
  // $stateParams, etc
  function init() {
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
      element = $compile(template)($scope);
      $scope.$digest();
    });
  }

  it('directory refetches files on state:instance.setup when source context version changes', function () {
    angular.mock.module(function ($provide) {
      $provide.value('$state', {
        '$current': {
          name: 'instance.setup'
        }
      });
    });
    init();

    keypather.set($scope, '$$childHead.dir.contents.fetch', function () {});
    sinon.spy($scope.$$childHead.dir.contents, 'fetch');
    $scope.$digest();
    sinon.assert.notCalled($scope.$$childHead.dir.contents.fetch);
    keypather.set($scope.$$childHead, 'build.contextVersions.models[0].source', Math.random());
    $scope.$digest();
    sinon.assert.called($scope.$$childHead.dir.contents.fetch);
  });
});
