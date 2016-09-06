'use strict';

var $scope;
var $controller;
var $rootScope;
var $interval;

describe('Github Integration Controller'.bold.underline.blue, function() {
  var GIC;
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
      _$controller_,
      _$interval_
    ) {
      $scope = _$rootScope_.$new();
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      $interval = _$interval_;
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

  it('should create interval on pollCheckRunnabot', function () {
    isRunnabotPartOfOrgResult = true;
    injectSetupCompile();
    $scope.$digest();
    GIC.pollCheckRunnabot();
    expect(GIC.pollingInterval).to.be.ok;
  });

  it('should stop interval when hasRunnabot and interval is true', function () {
    isRunnabotPartOfOrgResult = true;
    injectSetupCompile();
    sinon.stub($interval, 'cancel').returns();
    GIC.pollingInterval = true;
    $scope.$digest();
    sinon.assert.calledOnce($interval.cancel);
    sinon.assert.calledWith($interval.cancel, GIC.pollingInterval);
  });

  it('should stop interval when $destroyed', function () {
    isRunnabotPartOfOrgResult = true;
    injectSetupCompile();
    sinon.stub($interval, 'cancel').returns();
    $scope.$digest();
    $scope.$destroy();
    $scope.$digest();
    sinon.assert.calledOnce($interval.cancel);
    sinon.assert.calledWith($interval.cancel, GIC.pollingInterval);
  });
});
