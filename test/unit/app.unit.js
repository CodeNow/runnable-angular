var main    = require('main');
var chai    = require('chai');
var angular = require('angular');
var inject  = angular.injector(['app']).invoke;
var colors  = require('colors');
var Table   = require('cli-table');

var controllersIndex = require('../../client/controllers/index');

describe('general controller tests'.underline.red, function () {
  controllersIndex.forEach(function (controllerName) {
    var $scope = {};
    controllerName = controllerName.replace(/^./, function (firstChar) { return firstChar.toUpperCase(); });
    before(function () {
      inject(function($rootScope, $controller) {
        $scope = $rootScope.$new();
        $controller(controllerName, {
          $scope: $scope,
          $state: {}
        });
      });
    });

    var table = new Table({
      colWidths: [20, 50],
      chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': '',
               'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': '',
               'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': '', 'right': '' ,
               'right-mid': '' , 'middle': ' ' },
      style: { 'padding-left': 0, 'padding-right': 0 }
    });
    table.push([
      controllerName.underline.yellow,
      'namespaces scope properties'
    ]);

    it(table.toString(), function () {
      chai.expect($scope[controllerName.replace(/^Controller/, 'data')]).to.be.a('object');
    });
  });
});