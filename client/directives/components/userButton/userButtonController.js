'use strict';

require('app')
  .controller('UserButtonController', UserButtonController);

function UserButtonController(
  $q,
  $state,
  $scope,
  errs,
  fetchGithubOrgId,
  fetchGitHubUser,
  fetchUser,
  keypather,
  ModalService,
  promisify
) {
  var UBC = this;

  UBC.fetchUserForCommit = function (commit) {
    return $q.all({
      commit: promisify(commit, 'fetch')(),
      user: fetchUser()
    })
      .then(function (response) {
        var userName = keypather.get(response.commit, 'attrs.author.login');
        return $q.all([
          fetchGitHubUser(userName),
          promisify(response.user, 'fetchUsers')({ githubUsername: userName })
        ])
        .then(function (response) {
          var githubUser = response[0];
          var runnableUser = response[1];
          return {
            id: githubUser.id,
            login: githubUser.login,
            avatar_url: githubUser.avatar_url,
            email: githubUser.email,
            isRunnableUser: Boolean(runnableUser.models.length),
            showInviteForm: false,
            inviteSending: false,
            inviteSent: false
          };
        });
      })
      .catch(errs.handler);
  };

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
