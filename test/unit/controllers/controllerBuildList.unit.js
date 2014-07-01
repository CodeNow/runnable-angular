var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
require('browserify-angular-mocks');

var expect = chai.expect;

var uiRouter = require('angular-ui-router');
var uiAce    = require('angular-ui-ace');
var uiAnimate = require('browserify-angular-animate');

describe('ControllerBuildList'.bold.underline.blue, function () {
  var $appScope,
      $projectLayoutScope,
      $buildListScope,
      $stateParams,
      $state,
      dataBuildList;

  function initState () {
    angular.mock.module(uiRouter);
    angular.mock.module('ngMock');
    angular.mock.module('app');
    angular.mock.inject(function($rootScope, $controller) {
      $state = {};
      $stateParams = {};
      $appScope           = $rootScope.$new();
      $projectLayoutScope = $appScope.$new();
      $buildListScope     = $projectLayoutScope.$new();
      $controller('ControllerApp', {
        $scope: $appScope,
        $state: $state,
        $stateParams: $stateParams
      });
      $controller('ControllerProjectLayout', {
        $scope: $projectLayoutScope,
      });
      $controller('ControllerBuildList', {
        $scope: $buildListScope
      });
      dataBuildList = $buildListScope.dataBuildList;
    });
  }
  beforeEach(initState);

  describe('togglePopover'.blue, function () {
    it('displays popover when invoking togglePopover', function () {
      var event = {
        stopPropagation: sinon.spy()
      };
      expect(dataBuildList.popoverChangeRecipe.filter).to.equal('');
      expect(dataBuildList.showChangeRecipe).to.equal(false);
      dataBuildList.togglePopover('ChangeRecipe', event); // click 1
      expect(dataBuildList.showChangeRecipe).to.equal(true);
      expect(event.stopPropagation.callCount).to.equal(1);
    });

    it('togglePopover should be idempotent', function () {
      var event = {
        stopPropagation: sinon.spy()
      };
      dataBuildList.togglePopover('ChangeRecipe', event); // click 1
      dataBuildList.togglePopover('ChangeRecipe', event); // click 2
      expect(dataBuildList.showChangeRecipe).to.equal(true);
      expect(dataBuildList.popoverChangeRecipe.filter).to.equal('');
      expect(event.stopPropagation.callCount).to.equal(2);
      // type something into search
      dataBuildList.popoverChangeRecipe.filter = '123';
      expect(dataBuildList.showChangeRecipe).to.equal(true); // <-- technically a click to type... use protractor
      dataBuildList.togglePopover('ChangeRecipe', event);         // click 3
      expect(dataBuildList.showChangeRecipe).to.equal(true);
      expect(dataBuildList.popoverChangeRecipe.filter).to.equal('123');
      expect(event.stopPropagation.callCount).to.equal(3);
    });

    it('outside click event on document hides popovers when they are displayed', function () {
      var event = {
        stopPropagation: sinon.spy()
      };
      // trigger click outside of popover button
      $appScope.dataApp.click();
      expect(dataBuildList.showChangeRecipe).to.equal(false);
      expect(dataBuildList.popoverChangeRecipe.filter).to.equal('');
      dataBuildList.togglePopover('ChangeRecipe', event); // click 1
      expect(dataBuildList.showChangeRecipe).to.equal(true); // popover is showing after click
      $appScope.dataApp.click();
      expect(dataBuildList.showChangeRecipe).to.equal(false);
      expect(dataBuildList.popoverChangeRecipe.filter).to.equal('');
    });
  });
});
