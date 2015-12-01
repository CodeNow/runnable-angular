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
var keypather;

describe('TeamManagementController'.bold.underline.blue, function () {

  var TMMC;
  var fetchOrgMembersStub;
  var showModalStub;
  var showModalStubObject;
  var errs;

  var user;
  var orgName = 'PurpleNow';
  var registeredUsername = 'registered';
  var invitedUsername = 'invited';
  var uninvitedUsername = 'uninvited';
  var inviteEmail = 'invited@invited.com';
  var registered;
  var invited;
  var uninvited;

  beforeEach(function () {
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchOrgMembers', function ($q) {
        registered = generateGithubUserObject(registeredUsername, 1);
        registered.userModel = { attrs: generateUserObject(registeredUsername, 1) };
        invited = generateGithubUserObject('invited', 2);
        invited.userInvitation = { attrs: generateTeammateInvitationObject(123, 2, inviteEmail) };
        uninvited = generateGithubUserObject('uninvited', 3);
        var response = {
          all: [registered, invited, uninvited],
          registered: [registered],
          invited: [invited],
          uninvited: [uninvited]
        };
        fetchOrgMembersStub = sinon.stub().returns($q.when(response));
        return fetchOrgMembersStub;
      });
      $provide.factory('ModalService', function ($q) {
        showModalStubObject = {};
        showModalStubObject.close = false;
        showModalStub = sinon.stub().returns($q.when(showModalStubObject));
        return {
          showModal: showModalStub
        };
      });
      $provide.value('$state', { params: { userName: orgName } });
      $provide.factory('errs', function () {
        errs = {
          handler: sinon.stub()
        };
        return errs;
      });
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$q_,
      _keypather_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $q = _$q_;
      keypather = _keypather_;
    });
    TMMC = $controller('TeamManagementController', { $scope: $scope }, true)();
  });

  describe('Init', function () {

    it('should set the initial state before fetching members', function () {
      expect(TMMC.loading).to.equal(true);
      expect(TMMC.members).to.equal(null);
    });

    it('should fetch the members of an org when being instanstiated', function () {
      $scope.$digest();
      sinon.assert.calledOnce(fetchOrgMembersStub);
      sinon.assert.calledWith(fetchOrgMembersStub, orgName);
      expect(TMMC.loading).to.equal(false);
      expect(TMMC.members).to.be.an('object');
      expect(TMMC.members.all).to.be.an('array');
      expect(TMMC.members.registered).to.be.an('array');
      expect(TMMC.members.invited).to.be.an('array');
      expect(TMMC.members.uninvited).to.be.an('array');
      expect(TMMC.members.all.length).to.equal(3);
      expect(TMMC.members.registered.length).to.equal(1);
      expect(TMMC.members.invited.length).to.equal(1);
      expect(TMMC.members.uninvited.length).to.equal(1);
    });

    it('should set the emails addresses for registered and uninvited members from GitHub', function () {
      $scope.$digest();
      expect(TMMC.members.registered[0].email).to.be.a('string');
      expect(TMMC.members.registered[0].email).to.equal('jorge.silva@thejsj.com');
      expect(TMMC.members.uninvited[0].email).to.equal(null);
      expect(TMMC.members.invited[0].email).to.equal(inviteEmail);
    });
  });

  describe('newInvitationAdded event', function () {

    it('should remove the newly invited user from the uninvited users', function () {
      $scope.$digest();
      var uninvitedLength = TMMC.members.uninvited.length;
      var newlyInvitedUser = TMMC.members.uninvited[0];
      $rootScope.$broadcast('newInvitedAdded', newlyInvitedUser);
      $scope.$digest();
      expect(TMMC.members.uninvited.length).to.equal(uninvitedLength - 1);
      expect(TMMC.members.uninvited.indexOf(newlyInvitedUser)).to.equal(-1);
    });

    it('should add the newly invited user from the invited users', function () {
      $scope.$digest();
      var invitedLength = TMMC.members.invited.length;
      var newlyInvitedUser = TMMC.members.uninvited[0];
      $rootScope.$broadcast('newInvitedAdded', newlyInvitedUser);
      $scope.$digest();
      expect(TMMC.members.invited.length).to.equal(invitedLength + 1);
      expect(TMMC.members.invited.indexOf(newlyInvitedUser)).to.not.equal(-1);
    });

    it('should sort the users by their github login name', function () {
      $scope.$digest();
      var invitedLength = TMMC.members.invited.length;
      var logins = TMMC.members.invited.map(function (member) {
        return member.login;
      });
      var sortedLogins = logins.sort(function (a, b) {
        return a.login > b.login;
      });
      expect(logins).to.deep.equal(sortedLogins);
      var newlyInvitedUser = TMMC.members.uninvited[0];
      $rootScope.$broadcast('newInvitedAdded', newlyInvitedUser);
      $scope.$digest();
      expect(TMMC.members.invited.length).to.equal(invitedLength + 1);
      var logins2 = TMMC.members.invited.map(function (member) {
        return member.login;
      });
      var sortedLogins2 = logins2.sort(function (a, b) {
        return a.login > b.login;
      });
      expect(logins2).to.deep.equal(sortedLogins2);
    });

  });

  describe('openInvitationModal', function () {
    beforeEach(function () {
      TMMC.fetchMembers = sinon.stub();
    });

    it('should invoke the modal and not fetch the members if no invites have been sent', function () {
      $scope.$digest();
      sinon.assert.calledOnce(fetchOrgMembersStub);
      TMMC.openInvitationModal();
      $scope.$digest();
      sinon.assert.calledOnce(showModalStub);
      sinon.assert.calledOnce(fetchOrgMembersStub);
      expect(TMMC.loading).to.equal(false);
    });

    it('should invoke the modal and not fetch the members if no invites have been sent', function () {
      showModalStubObject.close = true;
      $scope.$digest();
      sinon.assert.calledOnce(fetchOrgMembersStub);
      TMMC.openInvitationModal();
      $scope.$digest();
      sinon.assert.calledOnce(showModalStub);
      sinon.assert.calledTwice(fetchOrgMembersStub);
    });
  });

  describe('popoverActions', function () {
    describe('resendInvitation', function () {
      it('should close all popovers when resending an invitation', function () {
        var popoversClosed = false;
        $rootScope.$on('close-popovers', function () {
          popoversClosed = true;
        });
        TMMC.popoverActions.resendInvitation();
      });
    });
  });
});
