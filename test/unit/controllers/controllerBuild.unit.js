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
  }
  beforeEach(initState);

  describe('getPopoverButtonText'.blue, function () {
    it('correctly formats string', function () {
      var baseReturnStr = 'Build';
      expect(dataBuild.actions.getPopoverButtonText(''))
        .to.equal(baseReturnStr);

      expect(dataBuild.actions.getPopoverButtonText('a'))
        .to.equal(baseReturnStr+'s in a');

      expect(dataBuild.actions.getPopoverButtonText('ab'))
        .to.equal(baseReturnStr+'s in ab');

      expect(dataBuild.actions.getPopoverButtonText('ab ab ab'))
        .to.equal(baseReturnStr+'s in ab ab ab');
    });
  });

  describe('resetInputModelValue'.blue, function () {
    it('should stop propagation of click events', function () {
      var event = {
        stopPropagation: sinon.spy()
      };
      dataBuild.actions.resetInputModelValue(event);
      expect(event.stopPropagation.callCount).to.equal(1);
    });

    it('should reset input model value to empty string if this is the first click', function () {
      var event = {
        stopPropagation: angular.noop
      };
      expect(dataBuild.data).to.have.property('inputHasBeenClicked', false);
      expect(dataBuild.data).to.have.property('buildName', $stateParams.buildName);
      dataBuild.actions.resetInputModelValue(event);
      expect(dataBuild.data).to.have.property('buildName', '');
      expect(dataBuild.data).to.have.property('inputHasBeenClicked', true);
    });

    it('should not reset input model value if dataBuild.inputHasBeenClick === true', function () {
      var event = {
        stopPropagation: angular.noop
      };
      dataBuild.actions.resetInputModelValue(event);
      dataBuild.data.buildName = 'test';
      dataBuild.actions.resetInputModelValue(event);
      expect(dataBuild.data.buildName).to.equal('test');
    });
  });

  describe('togglePopover'.blue, function () {
    it('popovers are not displayed by default', function () {
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', false);
      expect(dataBuild.data).to.have.property('showBuildOptionsDirty', false);
      expect(dataBuild.data).to.have.property('showFileMenu', false);
      expect(dataBuild.data).to.have.property('buildName', $stateParams.buildName);
      expect(dataBuild.data).to.have.property('inputHasBeenClicked', false);

      // confirm expected defaults ^
      Object
        .keys(ControllerBuild.constructor.initPopoverState($stateParams).data)
        .forEach(function (prop) {
          expect(dataBuild.data).to.have.property(prop, ControllerBuild.constructor.initPopoverState($stateParams).data[prop]);
        });
    });

    it('outside click event on document has no effect on popovers when not displayed', function () {
      $appScope.dataApp.click();
      expect(dataBuild.data).to.have.property('showBuildOptionsDirty', false);
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', false);
      expect(dataBuild.data).to.have.property('showFileMenu', false);
      expect(dataBuild.data).to.have.property('buildName', $stateParams.buildName);
      expect(dataBuild.data).to.have.property('inputHasBeenClicked', false);
    });

    it('outside click event on document hides popovers when they are displayed', function () {
      var event = {
        stopPropagation: sinon.spy()
      };
      dataBuild.actions.togglePopover('BuildOptionsClean', event);
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', true);
      $appScope.dataApp.click();
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', false);
    });

    it('togglePopover stops propagation of click event', function (done) {
      var event = {
        stopPropagation: sinon.spy()
      };
      dataBuild.actions.togglePopover('BuildOptionsClean', event);
      expect(event.stopPropagation.callCount).to.equal(1);
      setTimeout(function () {
        expect(dataBuild.data).to.have.property('showBuildOptionsClean', true);
        expect(dataBuild.data).to.have.property('showBuildOptionsDirty', false);
        expect(dataBuild.data).to.have.property('showFileMenu', false);
        done();
      }, 1);
    });

    it('togglePopover displays popover and hides other active popovers', function () {
      var event = {
        stopPropagation: sinon.spy()
      };
      dataBuild.actions.togglePopover('BuildOptionsClean', event);
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', true);
      expect(dataBuild.data).to.have.property('showBuildOptionsDirty', false);
      expect(dataBuild.data).to.have.property('showFileMenu', false);

      dataBuild.actions.togglePopover('BuildOptionsDirty', event);
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', false);
      expect(dataBuild.data).to.have.property('showBuildOptionsDirty', true);
      expect(dataBuild.data).to.have.property('showFileMenu', false);

      dataBuild.actions.togglePopover('FileMenu', event);
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', false);
      expect(dataBuild.data).to.have.property('showBuildOptionsDirty', false);
      expect(dataBuild.data).to.have.property('showFileMenu', true);

      expect(event.stopPropagation.callCount).to.equal(3);
    });

    it('togglePopover w/ no arguments hides any displayed popovers', function () {
      var event = {
        stopPropagation: sinon.spy()
      };
      dataBuild.actions.togglePopover('BuildOptionsClean', event);
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', true);
      expect(dataBuild.data).to.have.property('inputHasBeenClicked', false);
      $buildScope.$apply(function () {
        dataBuild.data.inputHasBeenClicked = true;
      });
      dataBuild.actions.togglePopover();
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', false);
      expect(dataBuild.data).to.have.property('inputHasBeenClicked', false);
    });

    it('repeat invokations of togglePopover with identical arguments is idempotent', function () {
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', false);

      dataBuild.actions.togglePopover('BuildOptionsClean', event);
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', true);

      dataBuild.actions.togglePopover('BuildOptionsClean', event);
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', true);
    });
  });

  describe('clean/dirty editing state'.blue, function () {
    it('state should be clean at initialization', function () {
      expect(dataBuild.data).to.have.property('isClean', true);
    });

    it('should remove all popovers and reset their states when isClean changes', function () {
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', false);

      $buildScope.$apply(function () {
        dataBuild.data.isClean = false;
      });
      // remains hidden
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', false);

      $buildScope.$apply(function () {
        dataBuild.data.isClean = false;
      });
      // remains hidden
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', false);

      dataBuild.actions.togglePopover('BuildOptionsClean', {stopPropagation: angular.noop});
      // is shown after toggle
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', true);

      $buildScope.$apply(function () {
        dataBuild.data.isClean = true;
      });

      // is hidden again after clean state change
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', false);
    });;
  });

  describe('explorer menu'.blue, function () {
    it('should initialize to open', function () {
      expect(dataBuild.data.showExplorer).to.equal(true);
    });

    it('should toggle open/closed', function () {
      dataBuild.actions.toggleExplorer();
      expect(dataBuild.data.showExplorer).to.equal(false);
      dataBuild.actions.toggleExplorer();
      expect(dataBuild.data.showExplorer).to.equal(true);
      dataBuild.actions.toggleExplorer();
      expect(dataBuild.data.showExplorer).to.equal(false);
    });

    it('should not toggle in response to external click events', function () {
      dataBuild.actions.toggleExplorer();
      expect(dataBuild.data.showExplorer).to.equal(false);
      dataBuild.actions.toggleExplorer();
      expect(dataBuild.data.showExplorer).to.equal(true);
      $appScope.dataApp.click();
      expect(dataBuild.data.showExplorer).to.equal(true);
    });
  });
});
