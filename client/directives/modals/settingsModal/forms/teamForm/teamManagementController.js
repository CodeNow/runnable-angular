'use strict';

require('app')
  .controller('TeamManagementController', TeamManagementController);

/**
 * @ngInject
 */
function TeamManagementController(
  $rootScope,
  $q,
  $state,
  errs,
  fetchOrgMembers,
  keypather,
  ModalService
) {
  var TMMC = this;
  angular.extend(TMMC, {
    loading: true,
    members: null
  });

  // Load initial state
  fetchMembers();

  $rootScope.$on('newInvitedAdded', function (event, user) {
    TMMC.members.invited.push(user);
    TMMC.members.invited = TMMC.members.invited.sort(function (a, b) {
      return a.login.toLowerCase() > b.login.toLowerCase();
    });
  });

  function fetchMembers () {
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
        unInvitedMembers: TMMC.members.uninvited
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
      return $q.when(true)
        .then(function () {
          return $q.reject(new Error('Resending invitations not yet implemented.'));
        })
       .catch(errs.handler);
    }
  };
}
