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

      $scope.params = {
        running: function () {
          return true;
        }
      };
      element = angular.element('<term params="params"></term>');

      $compile(element)($scope);
      $scope.$apply();
    });
  }
  beforeEach(initState);

  it('should create the Terminal element', function () {
    var termEl = element[0].firstChild;
    expect(termEl).to.be.ok;
    expect(termEl.className).to.equal('terminal');
  });
});
