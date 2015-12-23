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

describe('InviteModalController'.bold.underline.blue, function () {

  var IMC;
  var inviteGithubUserToRunnableStub;
  var user;
  var errs;
  var username = 'purpleBear';
  var userId = 777;
  var userEmail = 'purplebear@codenow.com';
  var orgId = 787;
  var unInvitedMembers;
  var closeStub = sinon.stub();

  beforeEach(function () {
    unInvitedMembers = [generateGithubUserObject(username, userId), generateGithubUserObject()];
    unInvitedMembers.forEach(function (member) {
      member.inviteEmail = userEmail;
    });
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
      $provide.value('teamName', 'hello');
      $provide.value('unInvitedMembers', unInvitedMembers);
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
  });

  it('should instanstiate the controller correctly', function () {
    expect(IMC.sending).to.equal(false);
    expect(IMC.invitesSent).to.equal(0);
    expect(IMC.activeUserId).to.equal(null);
    expect(IMC.sendingInviteUserId).to.equal(null);
  });

  describe('setactiveUserId', function () {
    it('should set the correct index for active an active user', function () {
      expect(IMC.activeUserId).to.equal(null);
      IMC.setActiveUserId(0);
      expect(IMC.activeUserId).to.equal(0);
      IMC.setActiveUserId(null);
      expect(IMC.activeUserId).to.equal(null);
    });
  });

  describe('sendInvitation', function () {
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
      sinon.assert.calledWith(inviteGithubUserToRunnableStub, userId, userEmail, 'hello');
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

});
