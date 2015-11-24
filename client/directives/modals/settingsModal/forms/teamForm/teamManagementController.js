'use strict';

require('app')
  .controller('TeamManagementController', TeamManagementController);

/**
 * @ngInject
 */
function TeamManagementController(
  $state,
  fetchOrgMembers,
  keypather,
  ModalService
) {
  var TMMC = this;
  angular.extend(TMMC, {
    loading: true,
    members: null
  });

  fetchOrgMembers($state.params.userName)
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

    TMMC.openInvitationModal = function () {
      ModalService.showModal({
        controller: 'InviteModalController',
        controllerAs: 'IMC',
        templateUrl: 'inviteModalView',
        inputs: {
          unInvitedMembers: TMMC.members.uninvited
        }
      });
    };
}
