var main    = require('main');
var chai    = require('chai');
var colors  = require('colors');
var angular = require('angular');
require('browserify-angular-mocks');

var uiRouter = require('angular-ui-router');

describe('ControllerBuild'.underline.red, function () {

  var $scope;

  beforeEach(angular.mock.module(uiRouter));
  beforeEach(function () {
    inject(function($rootScope, $controller) {
      $scope = $rootScope.$new();
      $controller('ControllerBuild', {
        $scope: $scope
      });
    });
  });

  it('getPopoverButtonText returns correct string', function () {
    var string = $scope.dataBuild.getPopoverButtonText('');
    chai.expect(string).to.equal('Build');
  });

});
