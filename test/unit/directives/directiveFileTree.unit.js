var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
require('browserify-angular-mocks');

var expect = chai.expect;

describe('directiveFileTree'.bold.underline.blue, function () {
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
