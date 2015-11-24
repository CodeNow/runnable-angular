'use strict';

require('app')
  .controller('SettingsModalController', SettingsModalController);

/**
 * @ngInject
 */
function SettingsModalController(
  $state,
  fetchOrgMembers,
  keypather,
  ModalService,
  tab,
  close
) {
  var SEMC = this;
  angular.extend(SEMC, {
    currentTab: tab,
    loading: {
      teamManagement: true
    },
    members: null,
    close: close
  });

  fetchOrgMembers($state.params.userName)
    .then(function (members) {
      // SEMC.loading.teamManagement = false;
      SEMC.members = members;

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
      SEMC.members.invited.forEach(setEmail('userInvitation.attrs.recipient.email'));
      SEMC.members.registered.forEach(setEmail());
      SEMC.members.uninvited.forEach(setEmail());
    });

    SEMC.openInvitationModal = function () {
      ModalService.showModal({
        controller: 'InviteModalController',
        controllerAs: 'IMC',
        templateUrl: 'inviteModalView',
        inputs: {
          unInvitedMembers: SEMC.members.uninvited
        }
      });
    };
}
