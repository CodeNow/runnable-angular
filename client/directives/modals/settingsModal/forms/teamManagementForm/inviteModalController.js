'use strict';

require('app')
  .controller('InviteModalController', InviteModalController);

/**
 * @ngInject
 */
function InviteModalController(
  $rootScope,
  $q,
  $state,
  errs,
  fetchUser,
  fetchOrgMembers,
  inviteGithubUserToRunnable,
  loading,

  isPersonalAccount,
  teamName,
  orgMembers,
  close
) {
  var IMC = this;
  angular.extend(IMC, {
    activeUserId: null,
    invitedAll: null,
    invitesSent: false,
    isPersonalAccount: isPersonalAccount,
    orgMembers: orgMembers,
    name: 'inviteModal',
    sendingInviteUserId: null,
    sending: false,
    showAlternateInviteModal: null,
    teamName: teamName
  });

  // Load uninvited members if they are not passed in
  loading(IMC.name, true);
  $q.when(true)
    .then(function () {
      // Empty array is valid input
      if (!orgMembers.uninvited && !Array.isArray(orgMembers.uninvited)) {
        return fetchOrgMembers($state.params.userName, true)
          .then(function (members) {
            return members.uninvited;
          });
      }
      return orgMembers.uninvited;
    })
    .then(function (unInvitedMembers) {
      unInvitedMembers.forEach(function (member) {
        // Set default invite email
        // We want `email` and `inviteEmail` to be different, since `email` is the
        // user's dfault GH email and should not be modified
        if (member.email) {
          member.inviteEmail = member.email;
        }
      });
      IMC.unInvitedMembers = unInvitedMembers;
      IMC.invitedAll = IMC.orgMembers.all.length === IMC.orgMembers.registered.length + IMC.orgMembers.invited.length;
      IMC.showAlternateInviteModal = IMC.isPersonalAccount || IMC.invitedAll || !IMC.unInvitedMembers.length;
      loading(IMC.name, false);
    })
    .catch(errs.handler);

  IMC.sendInvitation = function (user) {
    IMC.sendingInviteUserId = user.id;
    IMC.setActiveUserId(null);
    return inviteGithubUserToRunnable(user.id, user.email, teamName)
      .then(function (invitationModel) {
        IMC.invitesSent = true;
        user.inviteSent = true;
        // Append invitation to user
        user.userInvitation = invitationModel;
        $rootScope.$broadcast('newInvitedAdded', user);
        IMC.sendingInviteUserId = null;
        return invitationModel;
      })
      .catch(function (err) {
        errs.handler(err);
        IMC.sendingInviteUserId = null;
      });
  };

  IMC.setActiveUserId = function (userId) {
    IMC.activeUserId = userId;
  };

  IMC.close = function () {
    // Inform ModalService if any invites were sent
    $rootScope.$emit('updateTeammateInvitations', IMC.invitesSent);
    close(IMC.invitesSent);
  };

  IMC.getTextForInviteModal = function () {
    if (IMC.isPersonalAccount) {
      return 'Only GitHub organizations can have multiple teammates on Runnable, but it looks like you’re using a personal account';
    }
    if (IMC.orgMembers.all.length === 1) {
      return 'You’re the only one in this team. Add teammates to your GitHub team before inviting them to Runnable.';
    }
    if (IMC.invitedAll && IMC.orgMembers.all.length > 1) {
      return 'You’re amazing! You’ve already invited everyone on your GitHub team to Runnable.';
    }
  };
}
