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
  var fetchUserStub;
  var fetchGithubOrgIdStub;
  var fetchOrgMembersStub;
  var user;
  var errs;
  var username = 'purpleBear';
  var userId = 777;
  var userEmail = 'purplebear@codenow.com';
  var orgId = 787;
  var unInvitedMembers;
  var closeStub = sinon.stub();

  function setup (initWithoutUninvitedMembers) {
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
      $provide.factory('fetchUser', function ($q, $rootScope) {
        user = generateUserObject(username, userId, {
          createTeammateInvitation: sinon.spy(function (opts, cb) {
            var invite = generateTeammateInvitationObject(githubOrg.id, userId, userEmail);
            $rootScope.$evalAsync(function () {
              cb(null, { attrs: invite });
            });
            return { attrs: invite };
          })
        });
        fetchUserStub = sinon.stub().returns($q.when(user));
        return fetchUserStub;
      });
      $provide.factory('fetchGithubOrgId', function ($q) {
        fetchGithubOrgIdStub = sinon.stub().returns($q.when(githubOrg.id));
        return fetchGithubOrgIdStub;
      });
      $provide.factory('fetchOrgMembers', function ($q) {
        fetchOrgMembersStub = sinon.stub().returns($q.when({ uninvited: unInvitedMembers }));
        return fetchOrgMembersStub;
      });
      $provide.value('teamName', 'hello');
      $provide.value('unInvitedMembers', (function () {
        if (initWithoutUninvitedMembers) {
          return null;
        }
        return unInvitedMembers;
      }()));
      $provide.value('close', closeStub);
      $provide.value('$state', {
        params: {
          userName: 'CodeNow'
        }
      });
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
  });

  describe('Init withtout uninvited members', function () {
    beforeEach(function () {
      setup(true);
    });

    it('should be loading when started and should not be loading when loaded', function () {
      expect($rootScope.isLoading[IMC.name]).to.equal(true);
      $scope.$digest();
      expect($rootScope.isLoading[IMC.name]).to.equal(false);
    });

    it('should instanstiate the controller correctly, even without unInvitedMembers', function () {
      expect(IMC.sending).to.equal(false);
      expect(IMC.invitesSent).to.equal(false);
      expect(IMC.activeUserId).to.equal(null);
      expect(IMC.sendingInviteUserId).to.equal(null);
    });

    it('should load the uninvited user if not passed in', function () {
      expect(IMC.unInvitedMembers).to.equal(undefined);
      $scope.$digest();
      expect(IMC.unInvitedMembers).to.be.an('array');
      expect(IMC.unInvitedMembers).to.deep.equal(unInvitedMembers);
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
      expect(IMC.sendingInvitation).to.equal(true);
      expect(IMC.activeUserId).to.equal(null);
      $scope.$digest();
      expect(unInvitedMembers[0].inviteSent).to.equal(true);
      expect(IMC.sendingInvitation).to.equal(false);
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
      sinon.assert.calledOnce(fetchGithubOrgIdStub);
      sinon.assert.calledOnce(fetchUserStub);
      sinon.assert.calledOnce(user.createTeammateInvitation);
      sinon.assert.calledWith(user.createTeammateInvitation, {
        organization: {
          github: orgId,
        },
        recipient: {
          email: userEmail,
          github: userId
        }
      });
    });

    it('should display any errors to the user and reset the `sending` state', function () {
      /// Force function to throw an error
      user.createTeammateInvitation = sinon.spy(function (opts, cb) {
        $rootScope.$evalAsync(function () {
          cb(new Error('SuperError'), null);
        });
        return $q.reject(new Error('SuperError'));
      });
      // Send Invitation
      IMC.sendInvitation(unInvitedMembers[0]);
      expect(IMC.sendingInviteUserId).to.equal(userId);
      expect(IMC.sendingInvitation).to.equal(true);
      expect(IMC.activeUserId).to.equal(null);
      $scope.$digest();
      sinon.assert.calledOnce(errs.handler);
      expect(unInvitedMembers[0].inviteSent).to.equal(undefined);
      expect(IMC.sendingInvitation).to.equal(false);
      expect(IMC.sendingInviteUserId).to.equal(null);
    });
  });

});
