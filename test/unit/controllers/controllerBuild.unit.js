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

  describe('general popovers'.blue, function () {
    var rbpo;
    beforeEach(function () {
      rbpo = dataBuild.data.rbpo;
    });
    it('should initalize correctly', function () {
      expect(rbpo.data).to.have.property('show', false);
      expect(rbpo.data).to.have.property('environmentName', '');
      expect(rbpo.data).to.have.property('popoverInputHasBeenClicked', false);
    });
  });

  describe('rebuild popover', function () {
    var rbpo;
    beforeEach(function () {
      rbpo = dataBuild.data.rbpo;
    });
    describe('getPopoverButtonText'.blue, function () {
      it('correctly formats string', function () {
        var baseReturnStr = 'Build';
        expect(rbpo.actions.getPopoverButtonText(''))
          .to.equal(baseReturnStr);

        expect(rbpo.actions.getPopoverButtonText('a'))
          .to.equal(baseReturnStr+'s in a');

        expect(rbpo.actions.getPopoverButtonText('ab'))
          .to.equal(baseReturnStr+'s in ab');

        expect(rbpo.actions.getPopoverButtonText('ab ab ab'))
          .to.equal(baseReturnStr+'s in ab ab ab');
      });
    });

    describe('resetInputModelValue'.blue, function () {
      it('should reset input model value to empty string if this is the first click', function () {
        expect(rbpo.data).to.have.property('popoverInputHasBeenClicked', false);
        expect(rbpo.data).to.have.property('environmentName', '');
        rbpo.data.environmentName = 'llamas';
        rbpo.data.popoverInputHasBeenClicked = true;
        rbpo.actions.resetInputModelValue();
        expect(rbpo.data).to.have.property('environmentName', '');
        expect(rbpo.data).to.have.property('popoverInputHasBeenClicked', true);
      });

      it('should not reset input model value if rbpo.inputHasBeenClick === true', function () {
        var mockEvent = {
          stopPropagation: angular.noop
        };
        rbpo.actions.resetInputModelValue(mockEvent);
        rbpo.data.buildName = 'test';
        rbpo.actions.resetInputModelValue(mockEvent);
        expect(rbpo.data.buildName).to.equal('test');
      });
    });
  });

  describe('explorer menu'.blue, function () {
    it('should initialize to closed', function () {
      expect(dataBuild.data.showExplorer).to.equal(false);
    });
  });
});
