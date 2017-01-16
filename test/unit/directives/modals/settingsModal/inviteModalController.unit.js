/*global expect:true */
'use strict';
var apiMocks = require('../../../apiMocks');
var generateTeammateInvitationObject = apiMocks.generateTeammateInvitationObject;
var generateGithubUserObject = apiMocks.gh.generateGithubUserObject;
var generateGithubOrgObject = apiMocks.gh.generateGithubOrgObject;

var $rootScope;
var $controller;
var $scope;
var $q;

describe('InviteModalController'.bold.underline.blue, function () {

  var IMC;
  var closeSettingsModalStub;
  var inviteGithubUserToRunnableStub;
  var isPersonalAccountMock;
  var fetchOrgMembersStub;
  var errs;
  var user;
  var username = 'purpleBear';
  var userId = 777;
  var userEmail = 'purplebear@codenow.com';
  var orgId = 787;
  var unInvitedMembers;
  var orgMembersMock
  var closeStub = sinon.stub();

  function setup (customOrgMemebers) {
    unInvitedMembers = [generateGithubUserObject(username, userId), generateGithubUserObject()];
    unInvitedMembers.forEach(function (member) {
      member.email = userEmail;
    });
    orgMembersMock = customOrgMemebers || {
      uninvited: unInvitedMembers,
      all: [],
      invited: [],
      registered: []
    };
    angular.mock.module('app', function ($provide) {
      var githubOrg = generateGithubOrgObject('OrgName', orgId);
      $provide.factory('errs', function () {
        errs = {
          handler: sinon.stub()
        };
        return errs;
      });
      $provide.factory('inviteGithubUserToRunnable', function ($q) {
        var invite = generateTeammateInvitationObject(githubOrg.id, userId, userEmail);
        inviteGithubUserToRunnableStub = sinon.stub().returns($q.when({ attrs: invite }));
        return inviteGithubUserToRunnableStub;
      });
      $provide.factory('fetchOrgMembers', function ($q) {
        fetchOrgMembersStub = sinon.stub().returns($q.when(orgMembersMock));
        return fetchOrgMembersStub;
      });
      $provide.factory('closeSettingsModal', function () {
        closeSettingsModalStub = sinon.stub().returns(true);
        return closeSettingsModalStub;
      });
      $provide.value('currentOrg', {
        poppa: {
          attrs: {
            isPersonalAccount: isPersonalAccountMock
          }
        },
        github: {
          attrs: {
            login: 'CodeNow'
          }
        }
      });
      $provide.value('isPersonalAccount', isPersonalAccountMock);
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

    IMC = $controller('InviteModalController', { $scope: $scope }, true)();
  }

  describe('Init', function () {
    beforeEach(function () {
      setup();
    });

    it('should instanstiate the controller correctly', function () {
      expect(IMC.sending).to.equal(false);
      expect(IMC.invitesSent).to.equal(false);
      expect(IMC.activeUserId).to.equal(null);
      expect(IMC.sendingInviteUserId).to.equal(null);
    });
    it('should be loading when started and should not be loading when loaded', function () {
      expect($rootScope.isLoading[IMC.name]).to.equal(true);
      $scope.$digest();
      expect($rootScope.isLoading[IMC.name]).to.equal(false);
    });
  });

  describe('setactiveUserId', function () {
    beforeEach(function () {
      setup();
    });

    it('should set the correct index for active an active user', function () {
      expect(IMC.activeUserId).to.equal(null);
      IMC.setActiveUserId(0);
      expect(IMC.activeUserId).to.equal(0);
      IMC.setActiveUserId(null);
      expect(IMC.activeUserId).to.equal(null);
    });
  });

  describe('sendInvitation', function () {
    beforeEach(function () {
      setup();
    });

    it('should correctly set `sending` state', function () {
      IMC.sendInvitation(unInvitedMembers[0]);
      expect(IMC.sendingInviteUserId).to.equal(userId);
      expect(IMC.activeUserId).to.equal(null);
      $scope.$digest();
      expect(unInvitedMembers[0].inviteSent).to.equal(true);
      expect(IMC.sendingInviteUserId).to.equal(null);
    });

    it('should send the creation request to the server', function () {
      var invitePromise = IMC.sendInvitation(unInvitedMembers[0]);
      expect(invitePromise).to.eventually.have.property('attrs');
      expect(invitePromise).to.eventually.have.deep.property('attrs._id');
      expect(invitePromise).to.eventually.have.deep.property('attrs.created');
      expect(invitePromise).to.eventually.have.deep.property('attrs.organization');
      expect(invitePromise).to.eventually.have.deep.property('attrs.organization.github', orgId);
      expect(invitePromise).to.eventually.have.deep.property('attrs.recipient');
      expect(invitePromise).to.eventually.have.deep.property('attrs.recipient.github', userId);
      expect(invitePromise).to.eventually.have.deep.property('attrs.recipient.email', userEmail);
      $scope.$digest();
      sinon.assert.calledOnce(inviteGithubUserToRunnableStub);
      sinon.assert.calledWith(inviteGithubUserToRunnableStub, userId, userEmail, 'CodeNow');
    });

    it('should display any errors to the user and reset the `sending` state', function () {
      /// Force function to throw an error
      inviteGithubUserToRunnableStub.returns($q.reject(new Error('SuperError')));
      // Send Invitation
      IMC.sendInvitation(unInvitedMembers[0]);
      expect(IMC.sendingInviteUserId).to.equal(userId);
      expect(IMC.activeUserId).to.equal(null);
      $scope.$digest();
      sinon.assert.calledOnce(errs.handler);
      expect(unInvitedMembers[0].inviteSent).to.equal(undefined);
      expect(IMC.sendingInviteUserId).to.equal(null);
    });
  });

  describe('showing the correct invite modal', function () {
    beforeEach(function () {
      isPersonalAccountMock = false;
      orgMembersMock = {
        all: [1, 2, 3],
        registered: [1, 2],
        uninvited: [1],
        invited: []
      };
    });

    it('should not show the alternate invite modal for orgs w/ uninvited members', function () {
      setup(orgMembersMock);
      $scope.$digest();
      expect(IMC.showAlternateInviteModal).to.equal(false);
    });

    it('should show the alternate invite modal for personal accounts', function () {
      isPersonalAccountMock = true;
      setup(orgMembersMock);
      $scope.$digest();
      expect(IMC.showAlternateInviteModal).to.equal(true);
    });

    it('should show the alternate invite modal for full orgs', function () {
      orgMembersMock.invited = ['new guy'];
      setup(orgMembersMock);
      $scope.$digest();
      expect(IMC.showAlternateInviteModal).to.equal(true);
    });

    it('should show the alternate invite modal for one person orgs', function () {
      orgMembersMock.all = ['one guy'];
      orgMembersMock.registered = ['one guy'];
      orgMembersMock.invited = [];
      orgMembersMock.uninvited = [];
      setup(orgMembersMock);
      $scope.$digest();
      expect(IMC.showAlternateInviteModal).to.equal(true);
    });
  });

  describe('invite modal user message', function () {
    beforeEach(function () {
      setup();
    });

    it('should select the correct caption for a given scenario', function () {
      $rootScope.$digest();
      IMC.isPersonalAccount = true;
      var message = IMC.getTextForInviteModal();
      expect(message).to.equal('Only GitHub organizations can have multiple teammates on Runnable, but it looks like you’re using a personal account.');
      IMC.isPersonalAccount = false;
      IMC.orgMembers.all = [1];
      message = IMC.getTextForInviteModal();
      expect(message).to.equal('You’re the only one in this team. Add teammates to your GitHub team before inviting them to Runnable.');
      IMC.orgMembers.all = [1, 2];
      IMC.invitedAll = true;
      message = IMC.getTextForInviteModal();
      expect(message).to.equal('You’re amazing! You’ve already invited everyone on your GitHub team to Runnable.');
    });
  });
});
