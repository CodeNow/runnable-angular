'use strict';
// This wasn't testing anything useful anyway
describe.skip('directiveFileTreeDir'.bold.underline.blue, function () {
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
        'read-only': 'true'
      });
      element = $compile(template)($scope);
      $scope.$digest();
    });
  }
});
