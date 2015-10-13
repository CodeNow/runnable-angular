'use strict';

var $rootScope,
  $scope;
var element;
var $compile;
var keypather;
var $q;
var $elScope;
var readOnlySwitchController;
var apiMocks = require('./../../../apiMocks/index');

describe('containerUrlDirective'.bold.underline.blue, function () {
  var ctx;
  var mockInstance;
  beforeEach(function () {
    ctx = {};
  });

  beforeEach(function () {
    ctx.errsMock = {
      handler: sinon.spy()
    };
    ctx.extractInstancePortsValueMock = [];
    ctx.extractInstancePortsMock = sinon.spy(function () {
      return ctx.extractInstancePortsValueMock;
    });
    ctx.loadingMock = sinon.spy();
    angular.mock.module('app', function ($provide) {
      $provide.value('extractInstancePorts', ctx.extractInstancePortsMock);
    });
    angular.mock.inject(function (_$compile_, _$timeout_, _$rootScope_, _$q_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $scope = $rootScope.$new();
      $q = _$q_;

      mockInstance = {
        restart: sinon.spy(),
        fetch: sinon.spy(),
        status: sinon.stub().returns('running'),
        stop: sinon.spy(),
        start: sinon.spy(),
        build: {
          deepCopy: sinon.spy()
        }
      };

      var template = directiveTemplate.attribute('container-url', {
        instance: 'instance'
      });
      element = $compile(template)($scope);
    });
  });
  describe('onClipboardEvent', function () {
    beforeEach(function () {
      $scope.$digest();
      $elScope = element.isolateScope();
      $scope.$digest();
    });
    it('should say copied when successful', function () {
      expect($elScope.clipboardText).to.not.be.ok;
      $elScope.onClipboardEvent();
      $elScope.$digest();
      expect('Copied!').to.equal($elScope.clipboardText);
    });

    describe('on copy Error', function () {
      it('should use the errored message', function () {

        $elScope.clipboardText = 'asdasdds';
        $elScope.onClipboardEvent(new Error('asdasdsd'));
        $elScope.$digest();
        expect($elScope.clipboardText).to.contains('to Copy');
      });
    });
  });
  describe('shouldShowCopyButton', function () {
    // We can't modify the platform... so I'm not sure how to test this
    var cachedDoc;
    afterEach(function () {
      window = cachedDoc;
    });
    describe('should show', function () {
      beforeEach(function () {
        cachedDoc = window;
        window = {
          navigator: {
            platform: 'MacIntel'
          }
        };
        $scope.$digest();
        $elScope = element.isolateScope();
        $scope.$digest();
      });
      it('should show for Mac', function () {
        $elScope.$digest();
        expect($elScope.clipboardText).to.not.be.ok;
        $elScope.$digest();
        expect($elScope.shouldShowCopyButton).to.be.true;
      });
    });
  });
  describe('Extracting Ports', function () {
    beforeEach(function () {
      $scope.$digest();
      $elScope = element.isolateScope();
    });
    it('with 80', function () {
      ctx.extractInstancePortsValueMock = ['80', '101'];
      $scope.instance = mockInstance;
      $scope.$digest();
      expect($elScope.defaultPort).to.equal('');
    });
    it('without 80', function () {
      ctx.extractInstancePortsValueMock = ['280', '101'];
      $scope.instance = mockInstance;
      $scope.$digest();
      expect($elScope.defaultPort).to.equal(':280');
    });
  });
});
