'use strict';

require('app')
  .controller('UserButtonController', UserButtonController);

function UserButtonController(
  $scope,
  assign,
  errs,
  fetchGithubUserForCommit,
  inviteGithubUserToRunnable,
  keypather,
  ModalService
) {
  var UBC = this;

  UBC.fetchUserForCommit = function (commit) {
    return fetchGithubUserForCommit(commit)
      .then(function (user) {
        return assign(user, {
          showInviteForm: false,
          inviteSending: false,
          inviteSent: user.inviteSent || false
        });
      })
      .catch(errs.handler);
  };

  UBC.actions = {
    inviteUser: function (user) {
      user.inviteSending = true;
      return inviteGithubUserToRunnable(user.id, user.email)
        .then(function (invitationModel) {
          user.inviteSent = true;
          return invitationModel;
        })
        .catch(errs.handler)
        .finally(function () {
          user.inviteSending = false;
        });

    },
    goToTeammatesSettingsModal: function () {
      $scope.$broadcast('close-popovers');
      return ModalService.showModal({
        controller: 'SettingsModalController',
        controllerAs: 'SEMC',
        templateUrl: 'settingsModalView',
        inputs: {
          tab: 'teamManagement'
        }
      });
    },
    shouldShowInviteForm: function (user) {
      return user.showInviteForm && !user.inviteSent && !user.inviteSending;
    },
    shouldShowInviteButton: function (user) {
      return !user.showInviteForm && !user.inviteSending && !user.inviteSent && !user.isRunnableUser;
    }
  };
}
