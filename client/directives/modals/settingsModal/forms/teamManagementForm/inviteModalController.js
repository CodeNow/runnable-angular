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
  fetchGithubOrgId,
  fetchOrgMembers,
  inviteGithubUserToRunnable,
  loading,

  teamName,
  unInvitedMembers,
  close
) {
  var IMC = this;
  angular.extend(IMC, {
    name: 'inviteModal',
    activeUserId: null,
    sendingInviteUserId: null,
    sending: false,
    invitesSent: false
  });

  // Load uninvited members if they are not passed in
  loading(IMC.name, true);
  $q.when(true)
    .then(function () {
      // Empty array is valid input
      if (!unInvitedMembers && !Array.isArray(unInvitedMembers)) {
        return fetchOrgMembers($state.params.userName, true)
          .then(function (members) {
            return members.uninvited;
          });
      }
      return unInvitedMembers;
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
}
