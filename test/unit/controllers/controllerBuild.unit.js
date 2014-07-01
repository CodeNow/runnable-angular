var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
var _       = require('underscore');
require('browserify-angular-mocks');

var expect = chai.expect;

var uiRouter = require('angular-ui-router');

describe('ControllerBuild'.bold.underline.blue, function () {

  var $appScope,
      $projectLayoutScope,
      $buildScope,
      stateParams,
      state,
      dataBuild,
      $stateParams,
      $state,
      ControllerBuild;

  function initState () {
    angular.mock.module(uiRouter);
    angular.mock.module('ngMock');
    angular.mock.module('app');
    angular.mock.inject(function($rootScope, $controller) {
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
    });
  };

  beforeEach(initState);

  describe('getPopoverButtonText'.blue, function () {
    it('correctly formats string', function () {
      var baseReturnStr = 'Build';
      expect(dataBuild.getPopoverButtonText(''))
        .to.equal(baseReturnStr);

      expect(dataBuild.getPopoverButtonText('a'))
        .to.equal(baseReturnStr+'s in a');

      expect(dataBuild.getPopoverButtonText('ab'))
        .to.equal(baseReturnStr+'s in ab');

      expect(dataBuild.getPopoverButtonText('ab ab ab'))
        .to.equal(baseReturnStr+'s in ab ab ab');
    });
  });

  describe('resetInputModelValue'.blue, function () {
    it('should stop propagation of click events', function () {
      var event = {
        stopPropagation: sinon.spy()
      };
      dataBuild.resetInputModelValue(event);
      expect(event.stopPropagation.callCount).to.equal(1);
    });

    it('should reset input model value to empty string if this is the first click', function () {
      var event = {
        stopPropagation: angular.noop
      };
      expect(dataBuild).to.have.property('inputHasBeenClicked', false);
      expect(dataBuild).to.have.property('buildName', $stateParams.buildName);
      dataBuild.resetInputModelValue(event);
      expect(dataBuild).to.have.property('buildName', '');
      expect(dataBuild).to.have.property('inputHasBeenClicked', true);
    });

    it('should not reset input model value if dataBuild.inputHasBeenClick === true', function () {
      var event = {
        stopPropagation: angular.noop
      };
      dataBuild.resetInputModelValue(event);
      dataBuild.buildName = 'test';
      dataBuild.resetInputModelValue(event);
      expect(dataBuild.buildName).to.equal('test');
    });
  });

  describe('togglePopover'.blue, function () {
    it('popovers are not displayed by default', function () {
      expect(dataBuild).to.have.property('showBuildOptionsClean', false);
      expect(dataBuild).to.have.property('showBuildOptionsDirty', false);
      expect(dataBuild).to.have.property('showFileMenu', false);
      expect(dataBuild).to.have.property('buildName', $stateParams.buildName);
      expect(dataBuild).to.have.property('inputHasBeenClicked', false);

      // confirm expected defaults ^
      Object
        .keys(ControllerBuild.constructor.initPopoverState($stateParams))
        .forEach(function (prop) {
          expect(dataBuild).to.have.property(prop, ControllerBuild.constructor.initPopoverState($stateParams)[prop]);
        });
    });

    it('outside click event on document has no effect on popovers when not displayed', function () {
      $appScope.dataApp.click();
      expect(dataBuild).to.have.property('showBuildOptionsDirty', false);
      expect(dataBuild).to.have.property('showBuildOptionsClean', false);
      expect(dataBuild).to.have.property('showFileMenu', false);
      expect(dataBuild).to.have.property('buildName', $stateParams.buildName);
      expect(dataBuild).to.have.property('inputHasBeenClicked', false);
    });

    it('outside click event on document hides popovers when they are displayed', function () {
      var event = {
        stopPropagation: sinon.spy()
      };
      dataBuild.togglePopover('BuildOptionsClean', event);
      expect(dataBuild).to.have.property('showBuildOptionsClean', true);
      $appScope.dataApp.click();
      expect(dataBuild).to.have.property('showBuildOptionsClean', false);
    });

    it('togglePopover stops propagation of click event', function (done) {
      var event = {
        stopPropagation: sinon.spy()
      };
      dataBuild.togglePopover('BuildOptionsClean', event);
      expect(event.stopPropagation.callCount).to.equal(1);
      setTimeout(function () {
        expect(dataBuild).to.have.property('showBuildOptionsClean', true);
        expect(dataBuild).to.have.property('showBuildOptionsDirty', false);
        expect(dataBuild).to.have.property('showFileMenu', false);
        done();
      }, 1);
    });

    it('togglePopover displays popover and hides other active popovers', function () {
      var event = {
        stopPropagation: sinon.spy()
      };
      dataBuild.togglePopover('BuildOptionsClean', event);
      expect(dataBuild).to.have.property('showBuildOptionsClean', true);
      expect(dataBuild).to.have.property('showBuildOptionsDirty', false);
      expect(dataBuild).to.have.property('showFileMenu', false);

      dataBuild.togglePopover('BuildOptionsDirty', event);
      expect(dataBuild).to.have.property('showBuildOptionsClean', false);
      expect(dataBuild).to.have.property('showBuildOptionsDirty', true);
      expect(dataBuild).to.have.property('showFileMenu', false);

      dataBuild.togglePopover('FileMenu', event);
      expect(dataBuild).to.have.property('showBuildOptionsClean', false);
      expect(dataBuild).to.have.property('showBuildOptionsDirty', false);
      expect(dataBuild).to.have.property('showFileMenu', true);

      expect(event.stopPropagation.callCount).to.equal(3);
    });

    it('togglePopover w/ no arguments hides any displayed popovers', function () {
      var event = {
        stopPropagation: sinon.spy()
      };
      dataBuild.togglePopover('BuildOptionsClean', event);
      expect(dataBuild).to.have.property('showBuildOptionsClean', true);
      expect(dataBuild).to.have.property('inputHasBeenClicked', false);
      $buildScope.$apply(function () {
        dataBuild.inputHasBeenClicked = true;
      });
      dataBuild.togglePopover();
      expect(dataBuild).to.have.property('showBuildOptionsClean', false);
      expect(dataBuild).to.have.property('inputHasBeenClicked', false);
    });

    it('repeat invokations of togglePopover with identical arguments is idempotent', function () {
      expect(dataBuild).to.have.property('showBuildOptionsClean', false);

      dataBuild.togglePopover('BuildOptionsClean', event);
      expect(dataBuild).to.have.property('showBuildOptionsClean', true);

      dataBuild.togglePopover('BuildOptionsClean', event);
      expect(dataBuild).to.have.property('showBuildOptionsClean', true);
    });
  });

  describe('clean/dirty editing state', function () {
    it('state should be clean at initialization', function () {
      expect(dataBuild).to.have.property('isClean', true);
    });

    it('should remove all popovers and reset their states when isClean changes', function () {
      expect(dataBuild).to.have.property('showBuildOptionsClean', false);

      $buildScope.$apply(function () {
        dataBuild.isClean = false;
      });
      // remains hidden
      expect(dataBuild).to.have.property('showBuildOptionsClean', false);

      $buildScope.$apply(function () {
        dataBuild.isClean = false;
      });
      // remains hidden
      expect(dataBuild).to.have.property('showBuildOptionsClean', false);

      dataBuild.togglePopover('BuildOptionsClean', {stopPropagation: angular.noop});
      // is shown after toggle
      expect(dataBuild).to.have.property('showBuildOptionsClean', true);

      $buildScope.$apply(function () {
        dataBuild.isClean = true;
      });

      // is hidden again after clean state change
      expect(dataBuild).to.have.property('showBuildOptionsClean', false);
    });;
  });
});
