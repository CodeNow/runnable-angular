/*global expect:true */
'use strict';
var mockUserFetch = new (require('../../../fixtures/mockFetch.js'))();
var apiMocks = require('../../../apiMocks');
var generateUserObject = apiMocks.generateUserObject;
var generateTeammateInvitationObject = apiMocks.generateTeammateInvitationObject;
var generateGithubUserObject = apiMocks.gh.generateGithubUserObject;
var generateGithubOrgObject = apiMocks.gh.generateGithubOrgObject;

var $rootScope;
var $controller;
var $scope;
var $q;

describe('SettingsModalController'.bold.underline.blue, function () {

  var SEMC;
  var tabName = 'hello';
  var closeStub = sinon.stub();

  beforeEach(function () {
    angular.mock.module('app', function ($provide) {
      $provide.value('tab', tabName);
      $provide.value('close', closeStub);
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$q_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $q = _$q_;
    });

    SEMC = $controller('SettingsModalController', { $scope: $scope }, true)();
  });

  it('should instanstiate the controller correctly', function () {
    expect(SEMC.close).to.equal(closeStub);
    expect(SEMC.currentTab).to.equal(tabName);
  });
});
