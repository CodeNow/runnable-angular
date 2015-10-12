'use strict';

var $rootScope,
  $scope;
var element;
var $compile;
var keypather;
var $q;
var $elScope;
var CSBC;
var readOnlySwitchController;
var apiMocks = require('./../../../apiMocks/index');

describe('containerUrlDirective'.bold.underline.blue, function () {
  var ctx;
  var mockInstance;
  var promisifyMock;
  var mockMainACV;

  beforeEach(function () {
    ctx = {};
  });

  beforeEach(function () {
    ctx.errsMock = {
      handler: sinon.spy()
    };
    ctx.fetchPullRequestMock = {};

    ctx.loadingMock = sinon.spy();
    angular.mock.module('app', function ($provide) {
      $provide.value('errs', ctx.errsMock);
      $provide.factory('fetchPullRequest', function ($q) {
        return $q.when(ctx.fetchPullRequest);
      });
      $provide.factory('promisify', function ($q) {
        promisifyMock = sinon.spy(function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyMock;
      });
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
        },
        contextVersion: {
          getMainAppCodeVersion: sinon.stub().returns(mockMainACV)
        }
      };

      var template = directiveTemplate.attribute('container-url', {
        instance: 'instance'
      });
      $scope.instance = mockInstance;
      element = $compile(template)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  });
  describe('onClipboardEvent', function () {
    it('should say copied when successful', function () {
      expect('Click to copy').to.equal($elScope.clipboardText);
      $elScope.onClipboardEvent();
      $elScope.$digest();
      expect('Copied!').to.equal($elScope.clipboardText);
    });
    it('should warn the user when there is an error', function () {
      $elScope.clipboardText = 'asdasdds';
      $elScope.onClipboardEvent(new Error('asdasdsd'));
      $elScope.$digest();
      expect($elScope.clipboardText).to.contains('Copy not supported, press');
    });
    it('should say copied when successful', function () {
      $elScope.clipboardText = 'asdasdds';
      $elScope.onClipboardEvent(null, true);
      $elScope.$digest();
      expect('Click to copy').to.equal($elScope.clipboardText);
    });
  });
  describe('shouldShowCopyButton', function () {
    it('should not show for android', function () {
      var cached = window.navigator.platform;
      window.navigator.platform = 'Android';
      expect('Click to copy').to.equal($elScope.clipboardText);
      $elScope.$digest();
      expect($elScope.shouldShowCopyButton()).to.be.false;
      window.navigator.platform = cached;
    });
    it('should show for Mac', function () {
      var cached = window.navigator.platform;
      window.navigator.platform = 'MacIntel';
      expect('Click to copy').to.equal($elScope.clipboardText);
      $elScope.$digest();
      expect($elScope.shouldShowCopyButton()).to.be.true;
      window.navigator.platform = cached;
    });
  });
  describe('getModifierKey', function () {
    it('should return CTRL for windows', function () {
      var cached = window.navigator.platform;
      window.navigator.platform = 'Win32';
      $elScope.$digest();
      expect($elScope.getModifierKey()).to.equal('CTRL');
      window.navigator.platform = cached;
    });
    it('should return CTRL for windows', function () {
      var cached = window.navigator.platform;
      window.navigator.platform = 'MacIntel';
      $elScope.$digest();
      expect($elScope.getModifierKey()).to.equal('⌘');
      window.navigator.platform = cached;
    });
  });
});
