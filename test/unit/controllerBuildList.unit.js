var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var angular = require('angular');
var inject  = angular.injector(['app']).invoke;
var colors  = require('colors');

describe('ControllerBuildList'.underline.red, function () {

  var $appScope, $layoutScope, $buildListScope;

  beforeEach(function () {
    inject(function($rootScope, $controller) {
      $appScope = $rootScope.$new();
      $appScope.dataApp = {};
      $layoutScope = $appScope.$new();
      $layoutScope.dataLayout = {
        click: sinon.spy(function () {
          //$scope.$broadcast('app-document-click');
        })
      };
      $buildListScope = $layoutScope.$new();
      $buildListScope.dataBuidList = {
        togglePopover: function (popoverName, event) {}
      };

      $controller('ControllerApp', {
        $scope: $appScope,
        $state: {}
      });
      $controller('ControllerLayout', {
        $scope: $layoutScope
      });
      $controller('ControllerBuildList', {
        $scope: $buildListScope
      });
    });
  });

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
    $layoutScope.dataLayout.click();
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(false);
    chai.expect($buildListScope.dataBuildList.popoverChangeRecipe.filter).to.equal('');

    $buildListScope.dataBuildList.togglePopover('ChangeRecipe', event); // click 1
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(true); // popover is showing after click

    $layoutScope.dataLayout.click();
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(false);
    chai.expect($buildListScope.dataBuildList.popoverChangeRecipe.filter).to.equal('');

  });

});