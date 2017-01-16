'use strict';

require('app')
  .controller('InviteModalController', InviteModalController);

/**
 * @ngInject
 */
function InviteModalController(
  $rootScope,
  errs,
  keypather,
  currentOrg,
  fetchOrgMembers,
  inviteGithubUserToRunnable,
  loading,

  close
) {
  var IMC = this;
  angular.extend(IMC, {
    activeUserId: null,
    invitedAll: null,
    invitesSent: false,
    isPersonalAccount: keypather.get(currentOrg, 'poppa.attrs.isPersonalAccount'),
    name: 'inviteModal',
    sendingInviteUserId: null,
    sending: false,
    showAlternateInviteModal: null,
    teamName: currentOrg.github.attrs.login
  });

  loading(IMC.name, true);

  fetchOrgMembers(IMC.teamName, true)
    .then(function (members) {
      IMC.orgMembers = members;
      members.uninvited.forEach(function (member) {
        // Set default invite email
        // We want `email` and `inviteEmail` to be different, since `email` is the
        // user's dfault GH email and should not be modified
        if (member.email) {
          member.inviteEmail = member.email;
        }
      });
      IMC.unInvitedMembers = members.uninvited;
      IMC.invitedAll = IMC.orgMembers.all.length === IMC.orgMembers.registered.length + IMC.orgMembers.invited.length;
      IMC.showAlternateInviteModal = IMC.isPersonalAccount || IMC.invitedAll || !IMC.unInvitedMembers.length;
      loading(IMC.name, false);
    })
    .catch(errs.handler);

  IMC.sendInvitation = function (user) {
    IMC.sendingInviteUserId = user.id;
    IMC.setActiveUserId(null);
    return inviteGithubUserToRunnable(user.id, user.email, IMC.teamName)
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
      return 'Only GitHub organizations can have multiple teammates on Runnable, but it looks like you’re using a personal account.';
    }
    if (IMC.orgMembers.all.length === 1) {
      return 'You’re the only one in this team. Add teammates to your GitHub team before inviting them to Runnable.';
    }
    if (IMC.invitedAll && IMC.orgMembers.all.length > 1) {
      return 'You’re amazing! You’ve already invited everyone on your GitHub team to Runnable.';
    }
  };
}
