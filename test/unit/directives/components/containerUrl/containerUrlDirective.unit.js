'use strict';

var $rootScope,
  $scope;
var element;
var $compile;
var $window;
var keypather;
var $q;
var $elScope;
var apiMocks = require('./../../../apiMocks/index');

describe('containerUrlDirective'.bold.underline.blue, function () {
  var ctx;
  var mockInstance;
  beforeEach(function () {
    ctx = {};
  });

  function setup(replacementWindow) {
    ctx.errsMock = {
      handler: sinon.spy()
    };
    ctx.defaultContainerUrlValueMock = 'http://defaultUrlMock.foo:1234';
    ctx.defaultContainerUrlMock = sinon.spy(function () {
      return ctx.defaultContainerUrlValueMock;
    });
    ctx.loadingMock = sinon.spy();
    angular.mock.module('app', function ($provide) {
      $provide.value('defaultContainerUrl', ctx.defaultContainerUrlMock);
      if (replacementWindow) {
        $provide.value('$window', replacementWindow);
      }
    });
    angular.mock.inject(function (_$compile_, _$timeout_, _$rootScope_, _$q_, _$window_, _keypather_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $scope = $rootScope.$new();
      $q = _$q_;
      $window = _$window_;
      keypather = _keypather_;

      mockInstance = {
        restart: sinon.spy(),
        fetch: sinon.spy(),
        status: sinon.stub().returns('running'),
        stop: sinon.spy(),
        start: sinon.spy(),
        build: {
          deepCopy: sinon.spy()
        },
        containers: {
          models: [
            {
              attrs: {
                ports: ['89/asdasd']
              }
            }
          ]
        }
      };

      var template = directiveTemplate.attribute('container-url', {
        instance: 'instance'
      });
      element = $compile(template)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
      $scope.$digest();
    });
  }
  describe('onClipboardEvent', function () {
    beforeEach(function () {
      setup();
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
    it('should show for Mac', function () {
      setup({
        navigator: {
          platform: 'MacIntel'
        }
      });
      $elScope.$digest();
      expect($elScope.clipboardText).to.not.be.ok;
      $elScope.$digest();
      expect($elScope.shouldShowCopyButton).to.be.true;
    });
    it('for Android', function () {
      setup({
        navigator: {
          platform: 'Android'
        }
      });
      $elScope.$digest();
      expect($elScope.clipboardText).to.not.be.ok;
      $elScope.$digest();
      expect($elScope.shouldShowCopyButton).to.be.false;
    });
  });
  describe('Should expose container url', function () {
    beforeEach(function () {
      setup();
    });
    it('should expose the getContainerUrl as defaultContainerUrl service', function () {
      $scope.$digest();
      expect(ctx.defaultContainerUrlMock).to.equal($elScope.getContainerUrl);
    });
  });
});
