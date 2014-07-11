var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
var _       = require('underscore');
require('browserify-angular-mocks');

var expect = chai.expect;

describe('directiveFileTree'.bold.underline.blue, function () {
  var element;
  var $scope;
  function initState() {
    angular.mock.module('app');
    angular.mock.inject(function($compile, $rootScope){
      $scope = $rootScope;
      element = angular.element('<file-tree version="version" open-files="openFiles">');
      $compile(element)($scope);
    });
  }
  beforeEach(initState);
  it('first test', function () {
    debugger;
  });
});
