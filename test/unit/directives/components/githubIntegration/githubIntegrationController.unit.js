'use strict';

var $scope;
var $controller;
var $rootScope;

describe.only('Github Integration Controller'.bold.underline.blue, function() {
  var GIC;
  var addRunnabotToGithubOrgMock;
  var isRunnabotPartOfOrgMock;
  var isRunnabotPartOfOrgResult;
  var fetchGithubUserIsAdminOfOrgMock;
  var fetchGithubUserIsAdminOfOrgResult;
  var errsMock;
  var mockCurrentOrg = {
    poppa: {
      trialDaysRemaining: sinon.stub(),
      isInTrial: sinon.stub(),
      isInGrace: sinon.stub(),
      isGraceExpired: sinon.stub(),
      attrs: {
        hasPaymentMethod: false
      }
    },
    github: {
      attrs: {
        login: 'org',
        id: 'githubId1234'
      }
    }
  };
  function injectSetupCompile () {
    errsMock = {
      handler: sinon.spy()
    };
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('currentOrg', mockCurrentOrg);
      $provide.value('errs', errsMock);
      $provide.factory('addRunnabotToGithubOrg', function ($q) {
        addRunnabotToGithubOrgMock = sinon.stub().returns($q.when(true));
        return addRunnabotToGithubOrgMock;
      });
      $provide.factory('isRunnabotPartOfOrg', function ($q) {
        isRunnabotPartOfOrgMock = sinon.stub().returns($q.when(isRunnabotPartOfOrgResult));
        isRunnabotPartOfOrgMock.cache = {
          clear: sinon.stub()
        };
        return isRunnabotPartOfOrgMock;
      });
      $provide.factory('fetchGithubUserIsAdminOfOrg', function ($q) {
        fetchGithubUserIsAdminOfOrgMock = sinon.stub().returns($q.when(fetchGithubUserIsAdminOfOrgResult));
        fetchGithubUserIsAdminOfOrgMock.cache = {
          clear: sinon.stub()
        };
        return fetchGithubUserIsAdminOfOrgMock;
      });
    });

    angular.mock.inject(function (
      _$rootScope_,
      _$controller_
    ) {
      $scope = _$rootScope_.$new();
      $rootScope = _$rootScope_;
      $controller = _$controller_;
    });


    var laterController = $controller('GithubIntegrationController', {
      $scope: $scope
    }, true);

    GIC = laterController();
  }

  it('should fetch github user is admin and set isAdmin', function () {
    fetchGithubUserIsAdminOfOrgResult = true;
    injectSetupCompile();
    $scope.$digest();
    sinon.assert.calledOnce(fetchGithubUserIsAdminOfOrgMock);
    sinon.assert.calledWith(fetchGithubUserIsAdminOfOrgMock, 'org');
    expect(GIC.isAdmin).to.be.true;
  });

  it('should fetch isRunnabotPartOfOrg and set hasRunnabot', function () {
    isRunnabotPartOfOrgResult = true;
    injectSetupCompile();
    $scope.$digest();
    sinon.assert.calledOnce(isRunnabotPartOfOrgMock);
    sinon.assert.calledWith(isRunnabotPartOfOrgMock, 'org');
    expect(GIC.hasRunnabot).to.be.true;
  });

  describe('isRunnabotPartOfOrg cache clear', function () {
    beforeEach(function () {
      isRunnabotPartOfOrgResult = false;
    });
    beforeEach(injectSetupCompile);
    it('should clear if runnabot is not part of the org', function () {
      $scope.$digest();
      sinon.assert.calledOnce(isRunnabotPartOfOrgMock.cache.clear);
    });
    it('should clear after adding runnabot', function () {
      $scope.$digest();
      isRunnabotPartOfOrgMock.cache.clear.reset();
      GIC.addRunnabot();
      $scope.$digest();
      sinon.assert.calledOnce(isRunnabotPartOfOrgMock.cache.clear);
    });
  });

  describe('addRunnabot', function () {
    beforeEach(injectSetupCompile);
    it('should attempt to add runnabot', function () {
      GIC.addRunnabot();
      $scope.$digest();
      sinon.assert.calledOnce(addRunnabotToGithubOrgMock);
    });
  });
});
