'use strict';

require('app')
  .controller('TeamManagementFormController', TeamManagementFormController);

/**
 * @ngInject
 */
function TeamManagementFormController(
  $q,
  $rootScope,
  $scope,
  $state,
  currentOrg,
  errs,
  fetchOrgMembers,
  inviteGithubUserToRunnable,
  keypather,
  ModalService
) {
  var TMMC = this;
  angular.extend(TMMC, {
    loading: true,
    members: null,
    isPersonalAccount: keypather.get(currentOrg, 'poppa.attrs.isPersonalAccount')
  });

  // Load initial state
  fetchMembers();

  var newInviteAddedWatchterUnbind = $rootScope.$on('newInvitedAdded', function (event, user) {
    TMMC.members.invited.push(user);
    TMMC.members.invited = TMMC.members.invited.sort(function (a, b) {
      return a.login.toLowerCase() > b.login.toLowerCase();
    });
  });

  $scope.$on('$destroy', newInviteAddedWatchterUnbind);

  function fetchMembers () {
    var currentUser;
    return fetchOrgMembers($state.params.userName, true)
      .then(function (members) {
        TMMC.loading = false;
        TMMC.members = members;

        // Populate emails
        var setEmail = function (property) {
          return function (member) {
            var firstEmail;
            if (!property) {
              firstEmail = member.email || null;
            } else {
              firstEmail = keypather.get(member, property);
            }
            if (typeof firstEmail === 'string' || firstEmail === null) {
              member.email = firstEmail;
            }
          };
        };
        if (TMMC.isPersonalAccount) {
          currentUser = keypather.get(currentOrg, 'github.attrs');
          TMMC.members.registered.push(currentUser);
          return;
        }
        TMMC.members.invited.forEach(setEmail('userInvitation.attrs.recipient.email'));
        TMMC.members.registered.forEach(setEmail('userModel.attrs.accounts.github.emails[0].value'));
        TMMC.members.uninvited.forEach(setEmail(null));
      });
        
  }

  TMMC.openInvitationModal = function () {
    ModalService.showModal({
      controller: 'InviteModalController',
      controllerAs: 'IMC',
      templateUrl: 'inviteModalView',
      inputs: {
        teamName: $state.params.userName,
        orgMembers: TMMC.members,
        isPersonalAccount: TMMC.isPersonalAccount
      }
    })
    .then(function (modal) {
      return modal.close;
    })
    .then(function (plusOneInviteSent) {
      if (plusOneInviteSent) {
        // Asynchronously re-fetch all members
        fetchMembers();
      }
    });
  };

  TMMC.popoverActions = {
    resendInvitation: function (user) {
      $rootScope.$broadcast('close-popovers');
      user.sendingInvite = true;
      return inviteGithubUserToRunnable(user.id, user.email, $state.params.userName)
        .then(function () {
          user.sendingInvite = false;
        })
        .catch(errs.handler);
    }
  };
}
