var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
require('browserify-angular-mocks');

var uiRouter = require('angular-ui-router');
var uiAce    = require('angular-ui-ace');
var uiAnimate = require('browserify-angular-animate');

describe('ControllerBuildList'.underline.red, function () {
  var $appScope,
      $projectLayoutScope,
      $buildListScope,
      $stateParams,
      $state;

  beforeEach(angular.mock.module(uiRouter));
  beforeEach(angular.mock.module('ngMock'));
  beforeEach(angular.mock.module('app'));
  beforeEach(angular.mock.inject(function(
    $rootScope,
    $controller,
    $state,
    $stateParams
  ) {

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
  }));

  it('should display a popover when \'builds\' button click event triggered', function () {
    var event = {
      stopPropagation: sinon.spy()
    };
    chai.expect($buildListScope.dataBuildList.popoverChangeRecipe.filter).to.equal('');
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(false);
    $buildListScope.dataBuildList.togglePopover('ChangeRecipe', event); // click 1
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(true);
    chai.expect(event.stopPropagation.callCount).to.equal(1);
  });

  it('builds button click event should be idempotent', function () {
    var event = {
      stopPropagation: sinon.spy()
    };
    $buildListScope.dataBuildList.togglePopover('ChangeRecipe', event); // click 1
    $buildListScope.dataBuildList.togglePopover('ChangeRecipe', event); // click 2
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(true);
    chai.expect($buildListScope.dataBuildList.popoverChangeRecipe.filter).to.equal('');
    chai.expect(event.stopPropagation.callCount).to.equal(2);
    // type something into search
    $buildListScope.dataBuildList.popoverChangeRecipe.filter = '123';
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(true); // <-- technically a click to type... use protractor
    $buildListScope.dataBuildList.togglePopover('ChangeRecipe', event);         // click 3
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(true);
    chai.expect($buildListScope.dataBuildList.popoverChangeRecipe.filter).to.equal('123');
    chai.expect(event.stopPropagation.callCount).to.equal(3);
  });

  it('clicking on sibling or parent element hides the popover', function () {
    var event = {
      stopPropagation: sinon.spy()
    };
    // trigger click outside of popover button
    $appScope.dataApp.click();
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(false);
    chai.expect($buildListScope.dataBuildList.popoverChangeRecipe.filter).to.equal('');
    $buildListScope.dataBuildList.togglePopover('ChangeRecipe', event); // click 1
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(true); // popover is showing after click
    $appScope.dataApp.click();
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(false);
    chai.expect($buildListScope.dataBuildList.popoverChangeRecipe.filter).to.equal('');
  });
});
