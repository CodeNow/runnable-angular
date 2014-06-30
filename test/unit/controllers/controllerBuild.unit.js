var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
var _       = require('underscore');
require('browserify-angular-mocks');

var expect = chai.expect;
var assert = chai.assert;

var uiRouter = require('angular-ui-router');

describe('ControllerBuild'.underline.red, function () {

  var $appScope,
      $projectLayoutScope,
      $buildScope,
      stateParams,
      state,
      dataBuild,
      $stateParams,
      $state,
      ControllerBuild;

  beforeEach(angular.mock.module(uiRouter));
  beforeEach(angular.mock.module('ngMock'));
  beforeEach(angular.mock.module('app'));
  beforeEach(angular.mock.inject(function(
    $rootScope,
    $controller
  ) {

    $stateParams = {
      buildName: 'testBuildName'
    };
    $state = {
      dataApp: {
        stateParams: $stateParams
      }
    };
    $appScope           = $rootScope.$new();
    $projectLayoutScope = $appScope.$new();
    $buildScope         = $projectLayoutScope.$new();

    $controller('ControllerApp', {
      $scope: $appScope,
      $state: $state,
      $stateParams: $stateParams
    });
    $controller('ControllerProjectLayout', {
      $scope: $projectLayoutScope,
    });
    ControllerBuild = $controller('ControllerBuild', {
      $scope: $buildScope,
      $stateParams: $stateParams
    });
    dataBuild = $buildScope.dataBuild;
  }));

  it('returns correct popover button string text when invoking this.getPopoverButtonText', function () {
    var baseReturnStr = 'Build';
    assert.equal(dataBuild.getPopoverButtonText(''), baseReturnStr, 'returns base string when passed'+
                 ' empty string');
    assert.equal(dataBuild.getPopoverButtonText('a'), (baseReturnStr+'s in a'), 'returns base string'+
                 ' and formatted argument given string'+
                 ' of length 1');
    assert.equal(dataBuild.getPopoverButtonText('ab'), (baseReturnStr+'s in ab'), 'returns base'+
                ' string and formatted argument given'+
                ' string of length 2');
    assert.equal(dataBuild.getPopoverButtonText('ab ab ab'), (baseReturnStr+'s in ab ab ab'), 'returns base'+
                ' string and formatted argument given'+
                ' multi-word string');
  });

  it('popovers not displayed by default', function () {
    assert.propertyVal(dataBuild, 'showBuildOptionsDirty', false);
    assert.propertyVal(dataBuild, 'showBuildOptionsClean', false);
    assert.propertyVal(dataBuild, 'buildName', $stateParams.buildName);
    assert.propertyVal(dataBuild, 'inputHasBeenClicked', false);
  });

  it('click event on document has no effect on popovers when not displayed', function () {
    $appScope.dataApp.click();
    assert.propertyVal(dataBuild, 'showBuildOptionsDirty', false);
    assert.propertyVal(dataBuild, 'showBuildOptionsClean', false);
    assert.propertyVal(dataBuild, 'buildName', $stateParams.buildName);
    assert.propertyVal(dataBuild, 'inputHasBeenClicked', false);
  });

  it('togglePopover stops propagation of click event', function () {
    var event = {
      stopPropagation: sinon.spy()
    };
    dataBuild.togglePopover('BuildOptionsClean', event);
    assert.equal(event.stopPropagation.callCount, 1, 'stopPropagation was called once');
  });

  it('togglePopover displays popovers', function () {
    var event = {
      stopPropagation: sinon.spy()
    };
    dataBuild.togglePopover('BuildOptionsClean', event);
  });

  it('repeat invokations of togglePopover with identical arguments is idempotent', function () {
  });

});
