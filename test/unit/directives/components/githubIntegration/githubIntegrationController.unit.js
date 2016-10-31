'use strict';

var $scope;
var $controller;
var $rootScope;
var $interval;

describe('Github Integration Controller'.bold.underline.blue, function() {
  var GIC;
  var isRunnabotPartOfOrgMock;
  var isRunnabotPartOfOrgResult;
  var ahaGuideMock;
  var fetchGithubUserIsAdminOfOrgMock;
  var fetchGithubUserIsAdminOfOrgResult;
  var invitePersonalRunnabotStub;
  var isRunnabotPersonalCollaboratorStub;
  var removePersonalRunnabotStub;
  var errsMock;
  var mockCurrentOrg = {
    poppa: {
      trialDaysRemaining: sinon.stub(),
      isInTrial: sinon.stub(),
      isInGrace: sinon.stub(),
      isGraceExpired: sinon.stub(),
      attrs: {
        hasPaymentMethod: false,
        isPersonalAccount: false,
        name: 'santos l. halper'
      }
    },
    github: {
      attrs: {
        login: 'org',
        id: 'githubId1234'
      }
    }
  };
  var mockPersonalRunnabotResponse = [{isRunnabotPersonalCollaborator: true}];
  function injectSetupCompile () {
    errsMock = {
      handler: sinon.spy()
    };
    ahaGuideMock = {
      hasRunnabot: sinon.stub().returns()
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
      $provide.factory('ahaGuide', function () {
        return ahaGuideMock;
      });
      $provide.factory('fetchGithubUserIsAdminOfOrg', function ($q) {
        fetchGithubUserIsAdminOfOrgMock = sinon.stub().returns($q.when(fetchGithubUserIsAdminOfOrgResult));
        fetchGithubUserIsAdminOfOrgMock.cache = {
          clear: sinon.stub()
        };
        return fetchGithubUserIsAdminOfOrgMock;
      });
      $provide.factory('invitePersonalRunnabot', function ($q) {
        invitePersonalRunnabotStub = sinon.stub().returns($q.when(true));
        return invitePersonalRunnabotStub;
      });
      $provide.factory('isRunnabotPersonalCollaborator', function ($q) {
        isRunnabotPersonalCollaboratorStub = sinon.stub().returns($q.when(mockPersonalRunnabotResponse));
        return isRunnabotPersonalCollaboratorStub;
      });
      $provide.factory('removePersonalRunnabot', function ($q) {
        removePersonalRunnabotStub = sinon.stub().returns($q.when(true));
        return removePersonalRunnabotStub;
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

  describe('runnabot behavior for orgs', function () {

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

    it('should update ahaGuide when hasRunnabot', function () {
      isRunnabotPartOfOrgResult = true;
      injectSetupCompile();
      $scope.$digest();
      sinon.assert.calledOnce(ahaGuideMock.hasRunnabot);
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

    it('should not check whether runnabot is a contributor', function () {
      injectSetupCompile();
      $scope.$digest();
      sinon.assert.notCalled(isRunnabotPersonalCollaboratorStub);
    });
  });

  describe('runnabot behavior for personal accounts w/ runnabot', function () {

    beforeEach(function () {
      mockCurrentOrg.poppa.attrs.isPersonalAccount = true;
      mockPersonalRunnabotResponse = [{isRunnabotPersonalCollaborator: true}];
      isRunnabotPersonalCollaboratorStub.reset();
    })

    it('should check whether runnabot is a contributor', function () {
      injectSetupCompile();
      $scope.$digest();
      sinon.assert.calledOnce(isRunnabotPersonalCollaboratorStub);
      expect(GIC.isRunnabotPersonalCollaborator).to.equal(true);
    });

    it('should remove runnabot if toggled', function () {
      injectSetupCompile();
      $scope.$digest();
      sinon.assert.calledOnce(isRunnabotPersonalCollaboratorStub);
      // simulating user toggling runnabot to false
      GIC.isRunnabotPersonalCollaborator = false;
      GIC.toggleRunnabotCollaborator();
      $scope.$digest();
      sinon.assert.calledOnce(removePersonalRunnabotStub);
      sinon.assert.calledWith(removePersonalRunnabotStub, 'santos l. halper');
    })
  });

  describe('runnabot behavior for personal accounts w/out runnabot', function () {

    beforeEach(function () {
      mockCurrentOrg.poppa.attrs.isPersonalAccount = true;
      mockPersonalRunnabotResponse = [{isRunnabotPersonalCollaborator: true},{isRunnabotPersonalCollaborator: false}];
    });

    it('should invite runnabot if toggled', function () {
      injectSetupCompile();
      $scope.$digest();
      // simulating user toggling runnabot to true
      GIC.isRunnabotPersonalCollaborator = true;
      GIC.toggleRunnabotCollaborator();
      $scope.$digest();
      sinon.assert.calledTwice(isRunnabotPersonalCollaboratorStub);
      sinon.assert.calledWith(isRunnabotPersonalCollaboratorStub, 'santos l. halper');
      sinon.assert.calledOnce(invitePersonalRunnabotStub);
    })
  });

});
