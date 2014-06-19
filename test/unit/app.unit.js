var main = require('main');
var chai = require('chai');
var angular = require('angular');
var inject  = angular.injector(['app']).invoke;

var controllersIndex = require('../../client/controllers/index');

controllersIndex.forEach(function (controllerName) {
  controllerName = controllerName.replace(/^./, function (firstChar) { return firstChar.toUpperCase(); });
  describe(controllerName, function () {
    var $scope;

    beforeEach(function () {
      inject(function($rootScope, $controller) {
        $scope = $rootScope.$new();
        $controller(controllerName, {$scope: $scope});
      });
    });

    it('all controllers should namespace', function () {
      chai.expect($scope[controllerName.replace(/^Controller/, 'data')]).to.be.a('object');
    });
  });
});
