var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
require('browserify-angular-mocks');

var expect = chai.expect;

describe('directiveTerm'.bold.underline.blue, function () {
  var element;
  var $scope;
  function initState() {
    angular.mock.module('app');
    angular.mock.inject(function($compile, $rootScope){
      $scope = $rootScope.$new();

      element = angular.element('<term></term>');
      $compile(element)($scope);
      $scope.$digest();
    });
  }
  beforeEach(initState);

  // Skipping, need to inject build
  it.skip('should create the Terminal element', function () {
    var termEl = element[0].firstChild;
    expect(termEl).to.be.ok;
    expect(termEl.className).to.equal('terminal');
  });
});
