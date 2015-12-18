/*global directiveTemplate:true */
'use strict';
var $rootScope;
var $scope;
var $compile;
var $templateCache;
var $elScope;

var fetchSettingsStub;
var verifyChatIntegrationStub;
var mockDebounce;

describe.only('slackApiTokenValidtorDirective'.bold.underline.blue, function () {
  var ctx;
  function setup(slackApiToken, opts) {
    opts = opts || {};
    angular.mock.module('app', function ($provide) {
      $provide.factory('debounce', function () {
        mockDebounce = sinon.spy(function (cb) {
          return cb;
        });
        return mockDebounce;
      });
      $provide.factory('fetchSettings', function ($q) {
        fetchSettingsStub = sinon.stub().returns($q.when({ hello: 'world'}));
        return fetchSettingsStub;
      });
      $provide.factory('verifyChatIntegration', function ($q) {
        verifyChatIntegrationStub = sinon.spy(function () {
          if (opts.rejectApiToken) {
            return $q.reject(new Error('hello world'));
          }
          return $q.when({ hello: 'world' });
        });
        return verifyChatIntegrationStub;
      });
    });
    angular.mock.inject(function (
      _$templateCache_,
      _$compile_,
      _$rootScope_
    ) {
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
      $templateCache = _$templateCache_;
    });

    $scope.slackApiToken = slackApiToken;
    ctx = {};
    ctx.template = angular.element(
      '<form name="form">' +
        '<input slack-api-token-validator name = "slackApiTokenField" ng-model="slackApiToken">' +
      '</form>'
    );
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
  }

  describe('Valid Cases', function () {
    beforeEach(function () {
      setup('abc');
    });

    it('should be valid if the key is valid', function () {
      expect($scope.form.$valid).to.equal(true);
      sinon.assert.calledOnce(fetchSettingsStub);
      sinon.assert.calledOnce(verifyChatIntegrationStub);
    });
  });

  describe('Invalid Cases', function () {
    beforeEach(function () {
      setup('abc', { rejectApiToken: true });
    });

    it('should not be valid if key is not valid', function () {
      expect($scope.form.$valid).to.equal(false);
      sinon.assert.calledOnce(fetchSettingsStub);
      sinon.assert.calledOnce(verifyChatIntegrationStub);
    });
  });
});
