'use strict';

describe.skip('directiveFileTreeRoot'.bold.underline.blue, function () {
  var element;
  var $scope;
  function initState() {

    var mockVersion = {};
    var mockOpenFiles = {};


    angular.mock.module('app');
    angular.mock.inject(function($compile, $rootScope){
      $scope = $rootScope;
      $scope.mockVersion = mockVersion;
      $scope.mockOpenFiles = mockOpenFiles;

      element = angular.element('<file-tree-root version="mockVersion" open-files="mockOpenFiles">');
      $compile(element)($scope);
    });
  }
  beforeEach(initState);
  it('first test', function () {
  });
});
