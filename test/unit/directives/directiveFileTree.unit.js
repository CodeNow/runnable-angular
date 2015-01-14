'use strict';

describe.skip('directiveFileTree'.bold.underline.blue, function () {
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

      element = angular.element('<file-tree version="mockVersion" open-files="mockOpenFiles">');
      $compile(element)($scope);
    });
  }
  beforeEach(initState);
  it('first test', function () {
  });
});
