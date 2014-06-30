var main    = require('main');
var chai    = require('chai');
var colors  = require('colors');
var angular = require('angular');
require('browserify-angular-mocks');

var uiRouter = require('angular-ui-router');

describe('ControllerBuild'.underline.red, function () {

  var $scope;

  beforeEach(angular.mock.module(uiRouter));
  beforeEach(angular.mock.module('ngMock'));
  beforeEach(angular.mock.module('app'));
  beforeEach(angular.mock.inject(function($rootScope, $controller) {
    $scope = $rootScope.$new();
    $controller('ControllerBuild', {
      $scope: $scope
    });
  }));

  it('returns correct popover button string text when invoking this.getPopoverButtonText', function () {
    var baseReturnStr = 'Build';
    chai
      .expect($scope.dataBuild.getPopoverButtonText(''))
      .to.equal(baseReturnStr);
    chai
      .expect($scope.dataBuild.getPopoverButtonText('a'))
      .to.equal(baseReturnStr + 's in a');
    chai
      .expect($scope.dataBuild.getPopoverButtonText('ab'))
      .to.equal(baseReturnStr + 's in ab');
    chai
      .expect($scope.dataBuild.getPopoverButtonText('abc'))
      .to.equal(baseReturnStr + 's in abc');
    chai
      .expect($scope.dataBuild.getPopoverButtonText('ab ab ab'))
      .to.equal(baseReturnStr + 's in ab ab ab');
  });

});
