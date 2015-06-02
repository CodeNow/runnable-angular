'use strict';

var $controller,
    $rootScope,
    $scope,
    $window;
var keypather;
var apiMocks = require('../apiMocks/index');
var MockFetch = require('../fixtures/mockFetch');

describe('RuleTableStringController'.bold.underline.blue, function () {
  var ctx = {};
  function setup() {
    ctx.mockPopulateRules = new MockFetch();
    ctx.$log = {
      error: sinon.spy()
    };
    ctx.errs = {
      handler: sinon.spy()
    };
    angular.mock.module('app', function ($provide) {
      $provide.value('populateRulesWithWarningsAndDiffs', ctx.mockPopulateRules.fetch());
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _keypather_,
      _$window_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      $window = _$window_;
    });
    var container = eval(apiMocks.instances.runningWithContainers)[0].container;

    ctx.instance = {
      attrs: apiMocks.instances.runningWithContainers,
      containers: {
        models: [
          {
            attrs: container
          }
        ]
      }
    };
    var ca = $controller('RuleTableStringController', {
      '$scope': $scope
    });
  }
  describe('basics'.blue, function () {
    beforeEach(function () {
      setup();
    });
    it('should set up everything on the scope', function () {
      $rootScope.$digest();
      expect($scope.header, 'header').to.be.ok;
      expect($scope.header.description, 'description').to.equal('New string rule');
      expect($scope.header.title, 'title').to.equal('Strings');
      expect($scope.properties, 'properties').to.be.ok;
      expect($scope.properties.allowedTableTypes, 'allowedTableTypes').to.deep.equal(['replace']);
      expect($scope.properties.action, 'action').to.deep.equal('replace');
      expect($scope.popoverTemplate, 'popoverTemplate').to.equal('viewPopoverStringRule');
      expect($scope.performCheck, 'performCheck').to.be.a.function;
      expect($scope.getMatchDisplay, 'getMatchDisplay').to.be.a.function;
    });
  });

});
