'use strict';

var UBC;
var $controller;
var $rootScope;
var $scope;
var $q;
var fetchGithubUserForCommitStub;
var errsStub;
var inviteGithubUserToRunnableStub;
var ModalServiceStub;

var user;

describe('UserButtonController'.bold.underline.blue, function () {
  function setup() {

    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchGithubUserForCommit', function ($q) {
        user = {};
        fetchGithubUserForCommitStub = sinon.stub().returns($q.when(user));
        return fetchGithubUserForCommitStub;
      });
      $provide.factory('inviteGithubUserToRunnable', function ($q) {
        inviteGithubUserToRunnableStub = sinon.stub().returns($q.when(true));
        return inviteGithubUserToRunnableStub;
      });
      $provide.factory('ModalService', function ($q) {
        ModalServiceStub = {
          showModal: sinon.stub().returns($q.when({
            close: $q.when(true)
          }))
        };
        return ModalServiceStub;
      });
      $provide.factory('errs', function () {
        errsStub = {
          handler: sinon.stub()
        };
        return errsStub;
      });
    });
    angular.mock.inject(function (
      _$controller_,
      _$q_,
      _$rootScope_
    ) {
      $controller = _$controller_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
    });

    UBC = $controller('UserButtonController', {
      '$scope': $scope
    });
  }

  describe('fetchUserForCommit'.blue, function () {
    beforeEach(function () {
      setup();
    });

    it('should fetch the user for a given commit', function () {
      var commit = {};
      UBC.fetchUserForCommit(commit);
      $scope.$digest();
      sinon.assert.calledOnce(fetchGithubUserForCommitStub);
      sinon.assert.calledWith(fetchGithubUserForCommitStub, commit);
      expect(user).to.be.an('object');
      expect(user).to.equal(user);
      expect(user.showInviteForm).to.equal(false);
      expect(user.inviteSending).to.equal(false);
      expect(user.inviteSent).to.equal(false);
    });

    it('should notify the user if there was an error', function () {
      var commit = {};
      var err = new Error('Hello');
      fetchGithubUserForCommitStub.returns($q.reject(err));

      UBC.fetchUserForCommit(commit);
      $scope.$digest();
      sinon.assert.calledOnce(errsStub.handler);
      sinon.assert.calledWith(errsStub.handler, err);
    });
  });

  describe('inviteUser'.blue, function () {
    var user;
    beforeEach(function () {
      user = {
        id: 1,
        email: 'jorge@runnable.com'
      };
      setup();
    });

    it('should set the user to inviteSending', function () {
      UBC.actions.inviteUser(user);
      expect(user.inviteSending).to.equal(true);
    });

    it('should invite the user', function () {
      UBC.actions.inviteUser(user);
      $scope.$digest();
      sinon.assert.calledOnce(inviteGithubUserToRunnableStub);
      sinon.assert.calledWith(inviteGithubUserToRunnableStub, user.id, user.email);
      expect(user.inviteSending).to.equal(false);
      expect(user.inviteSent).to.equal(true);
    });

    it('should notify the user if there was an error', function () {
      var err = new Error('Hello');
      inviteGithubUserToRunnableStub.returns($q.reject(err));

      UBC.actions.inviteUser(user);
      $scope.$digest();

      sinon.assert.calledOnce(inviteGithubUserToRunnableStub);
      sinon.assert.calledWith(inviteGithubUserToRunnableStub, user.id, user.email);
      sinon.assert.calledOnce(errsStub.handler);
      sinon.assert.calledWith(errsStub.handler, err);
      expect(user.inviteSending).to.equal(false);
    });
  });

  describe('goToTeammatesSettingsModal'.blue, function () {
    beforeEach(function () {
      setup();
    });

    it('should close all popovers', function () {
      var popoversClose = false;
      $scope.$on('close-popovers', function () {
        popoversClose = true;
      });

      UBC.actions.goToTeammatesSettingsModal();
      $scope.$digest();

      expect(popoversClose).to.equal(true);
    });

    it('should show the modal', function () {
      UBC.actions.goToTeammatesSettingsModal();
      $scope.$digest();
      sinon.assert.calledOnce(ModalServiceStub.showModal);
      sinon.assert.calledWith(ModalServiceStub.showModal, {
        controller: 'SettingsModalController',
        controllerAs: 'SEMC',
        templateUrl: 'settingsModalView',
        inputs: {
          tab: 'teamManagement'
        }
      });
    });
  });
});
