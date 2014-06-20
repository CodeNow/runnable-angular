var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var angular = require('angular');
var inject  = angular.injector(['app']).invoke;
var colors  = require('colors');

describe('ControllerBuildList'.underline.red, function () {
  it('should display a popover when \'builds\' button click event triggered, and hide' +
     'popover with click event triggered on any sibling or parent element', function () {
    var $appScope, $layoutScope, $buildListScope;
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

    // click button to display popover twice
    var event = {
      stopPropagation: sinon.spy()
    };
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(undefined);
    $buildListScope.dataBuildList.togglePopover('ChangeRecipe', event); // click 1
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(true);
    $buildListScope.dataBuildList.togglePopover('ChangeRecipe', event); // click 2
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(true);

    // type something into search
    $buildListScope.dataBuildList.popoverChangeRecipe.filter = '123';
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(true); // <-- technically a click to type... use protractor
    $buildListScope.dataBuildList.togglePopover('ChangeRecipe', event);         // click 3
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(true);
    chai.expect($buildListScope.dataBuildList.popoverChangeRecipe.filter).to.equal('123');
    chai.expect(event.stopPropagation.callCount).to.equal(3);

    // trigger click outside of popover button
    $layoutScope.dataLayout.click();
    chai.expect($buildListScope.dataBuildList.showChangeRecipe).to.equal(false);
    chai.expect($buildListScope.dataBuildList.popoverChangeRecipe.filter).to.equal('');

  });
});