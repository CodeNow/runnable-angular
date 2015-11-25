'use strict';

require('app')
  .controller('TeamManagementController', TeamManagementController);

/**
 * @ngInject
 */
function TeamManagementController(
  $q,
  $state,
  $rootScope,
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

  function fetchMembers () {
    return fetchOrgMembers($state.params.userName)
      .then(function (members) {
        TMMC.loading = false;
        TMMC.members = members;

        // Populate emails
        var setEmail = function (property) {
          if (!property) {
            property = 'userModel.attrs.accounts.github.emails[0].value';
          }
          return function (member) {
            var firstEmail = keypather.get(member, property);
            if (typeof firstEmail === 'string') {
              member.email = firstEmail;
            }
          };
        };
        TMMC.members.invited.forEach(setEmail('userInvitation.attrs.recipient.email'));
        TMMC.members.registered.forEach(setEmail());
        TMMC.members.uninvited.forEach(setEmail());
      });
  };

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
    .then(function () {
      TMMC.loading = true;
      return fetchMembers();
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
