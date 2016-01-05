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
  loading,
  promisify,

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
    IMC.sendingInvitation = true;
    IMC.setActiveUserId(null);
    return $q.all({
      user: fetchUser(),
      githubOrgId: fetchGithubOrgId(teamName)
    })
    .then(function (response) {
      return promisify(response.user, 'createTeammateInvitation')({
        organization: {
          github: response.githubOrgId
        },
        recipient: {
          email: user.inviteEmail,
          github: user.id
        }
      });
    })
    .then(function (invitationModel) {
      IMC.invitesSent = true;
      user.inviteSent = true;
      // Append invitation to user
      user.userInvitation = invitationModel;
      $rootScope.$broadcast('newInvitedAdded', user);
      IMC.sendingInvitation = false;
      IMC.sendingInviteUserId = null;
      return invitationModel;
    })
    .catch(function (err) {
      errs.handler(err);
      IMC.sendingInvitation = false;
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
