var main = require('main');
var chai = require('chai');
var angular = require('angular');
var inject  = angular.injector(['app']).invoke;

describe('controllerBuild', function () {

  var $scope;

  beforeEach(function () {
    inject(function($rootScope, $controller) {
      $scope = $rootScope.$new();
      $controller('ControllerBuild', {$scope: $scope});
    });
  });

  it('should namespace properties', function () {
    chai.expect($scope.dataBuild).to.be.a('object');
  });

});