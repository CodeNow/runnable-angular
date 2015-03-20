'use strict';

// injector-provided
var $rootScope,
  $scope,
  $compile,
  $document,
  $log,
  $templateCache;

var apiMocks = require('../apiMocks/index');

describe('directiveCoachMarks'.bold.underline.blue, function () {
  var ctx;
  function injectSetupCompile() {

    ctx = {};
    ctx.coachMarkData = null;
    ctx.coachMarkDataMock = sinon.spy(function (type, cb) {
      cb(ctx.coachMarkData);
    });
    angular.mock.module('app', function ($provide) {
      $provide.value('fetchCoachMarkData', ctx.coachMarkDataMock);
    });
    angular.mock.inject(function (
      _$templateCache_,
      _$compile_,
      _$document_,
      _$rootScope_,
      _$log_
    ) {
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
      $document = _$document_;
      $templateCache = _$templateCache_;
      $log = _$log_;
    });
  }

  function createElement(removeTemplate, removeStyle, removeType) {
    var attrs = {
      'coach-mark-template': 'viewCoachMarksPanelPopover',
      'coach-mark-style': '{\"left\": -18, \"top\": 6}',
      'coach-mark-type': 'editButton'
    };
    if (removeTemplate) {
      delete attrs['coach-mark-template'];
    }
    if (removeStyle) {
      delete attrs['coach-mark-style'];
    }
    if (removeType) {
      delete attrs['coach-mark-type'];
    }
    ctx.template = '<form>' +
      directiveTemplate.attribute('show-coach-marks', attrs) +
      '</form>';

    ctx.parentElement = $compile(ctx.template)($scope);
    ctx.element = angular.element(ctx.parentElement.children());
    $scope.$digest();
  }

  describe('Basic functionality', function () {
    it('should have everything on the scope that was given', function () {
      injectSetupCompile();
      createElement();
      expect($scope.coachMarkTemplate).to.be.ok;
      expect($scope.coachMarkTemplate).to.equal('viewCoachMarksPanelPopover');

      $scope.$destroy();
    });
  });

  describe('Error Handling', function () {
    beforeEach(injectSetupCompile);
    it('should error about missing template', function () {
      var errorStub = sinon.stub($log, 'error');
      createElement(true);

      sinon.assert.calledWith(errorStub, 'Coach mark needs a template');
      $scope.$destroy();
    });
    it('should error about missing type', function () {
      var errorStub = sinon.stub($log, 'error');
      createElement(false, false, true);
      sinon.assert.calledWith(errorStub, 'Coach mark needs a type');

      $scope.$destroy();
    });
    it('should warn about missing style', function () {
      var warnStub = sinon.stub($log, 'warn');
      createElement(false, true, false);
      sinon.assert.calledWith(warnStub, 'Coach mark parse failed for editButton');

      $scope.$destroy();
    });
  });

  describe('Functionality', function () {
    beforeEach(injectSetupCompile);
    it('should just return when fetchCoachMarkData returns null', function () {
      createElement();
      expect($scope.coachMarkData).to.be.undefined;
      expect($document[0].querySelector('.guide')).to.not.be.ok;
      $scope.$destroy();
    });
    it('should add the coach mark to the screen when it gets an object', function () {
      ctx.coachMarkData = {
        save: sinon.spy()
      };
      createElement();
      expect($scope.coachMarkData).to.be.ok;
      expect($scope.coachMarkData.dismiss).to.be.function;
      expect($scope.coachMarkData.getStyle).to.be.function;
      expect($document[0].querySelector('.guide')).to.be.ok;

      $scope.$destroy();
      $scope.$digest();
      expect($document[0].querySelector('.guide')).to.not.be.ok;
    });
    it('should remove the coachmark from the dom on dismiss', function () {
      ctx.coachMarkData = {
        save: sinon.spy()
      };
      createElement();
      expect($scope.coachMarkData).to.be.ok;
      expect($scope.coachMarkData.dismiss).to.be.function;
      expect($scope.coachMarkData.getStyle).to.be.function;
      expect($document[0].querySelector('.guide')).to.be.ok;
      $scope.coachMarkData.dismiss();
      $scope.$digest();
      expect($document[0].querySelector('.guide')).to.not.be.ok;
      sinon.assert.calledOnce(ctx.coachMarkData.save);

      $scope.$destroy();

      $scope.$digest();
      expect($document[0].querySelector('.guide')).to.not.be.ok;
    });
  });
});
