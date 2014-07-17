var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
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
    it('should reset input model value to empty string if this is the first click', function () {
      expect(dataBuild.data).to.have.property('inputHasBeenClicked', false);
      expect(dataBuild.data).to.have.property('buildName', $stateParams.buildName);
      dataBuild.actions.resetInputModelValue();
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

  describe('popovers'.blue, function () {
    it('popovers are not displayed by default', function () {
      expect(dataBuild.data).to.have.property('showBuildOptionsClean', false);
      expect(dataBuild.data).to.have.property('showBuildOptionsDirty', false);
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
      expect(dataBuild.data).to.have.property('buildName', $stateParams.buildName);
      expect(dataBuild.data).to.have.property('inputHasBeenClicked', false);
    });

    it('//outside click event on document hides popovers when they are displayed', function () {
    });

  });

  describe('clean/dirty editing state'.blue, function () {
    it('state should be clean at initialization', function () {
      expect(dataBuild.data).to.have.property('isClean', true);
    });
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
