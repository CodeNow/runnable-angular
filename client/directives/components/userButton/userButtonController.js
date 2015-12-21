'use strict';

require('app')
  .controller('UserButtonController', UserButtonController);

function UserButtonController(
  $q,
  $state,
  $scope,
  errs,
  promisify,
  fetchGithubOrgId,
  fetchUser,
  ModalService
) {
  var UBC = this;
  UBC.actions = {
    inviteUser: function (user) {
      user.inviteSending = true;
      return $q.all({
          user: fetchUser(),
          githubOrgId: fetchGithubOrgId($state.params.userName)
        })
        .then(function (response) {
          return promisify(response.user, 'createTeammateInvitation')({
            organization: {
              github: response.githubOrgId
            },
            recipient: {
              email: user.email,
              github: user.id
            }
          });
        })
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
    }
  };
}
