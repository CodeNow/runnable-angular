var main    = require('main');
var chai    = require('chai');
var angular = require('angular');
var inject  = angular.injector(['app']).invoke;
var colors  = require('colors');

var controllerName = 'ControllerBuild';

describe(controllerName.underline.red, function () {

  var $scope;

  beforeEach(function () {
    inject(function($rootScope, $controller) {
      $scope = $rootScope.$new();
      $controller(controllerName, {$scope: $scope});
    });
  });

  it('should namespace', function () {
    chai.expect($scope[controllerName.replace(/^Controller/, 'data')]).to.be.a('object');
  });

});