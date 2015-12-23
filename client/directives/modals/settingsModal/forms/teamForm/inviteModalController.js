'use strict';

require('app')
  .controller('InviteModalController', InviteModalController);

/**
 * @ngInject
 */
function InviteModalController(
  $rootScope,
  $q,
  fetchUser,
  fetchGithubOrgId,
  promisify,
  errs,
  teamName,
  unInvitedMembers,
  close
) {
  var IMC = this;
  angular.extend(IMC, {
    unInvitedMembers: unInvitedMembers,
    activeUserId: null,
    sendingInviteUserId: null,
    sending: false,
    invitesSent: 0
  });

  unInvitedMembers.forEach(function (member) {
    // Set default invite email
    // We want `email` and `inviteEmail` to be different, since `email` is the
    // user's dfault GH email and should not be modified
    if (member.email) {
      member.inviteEmail = member.email;
    }
  });

  IMC.sendInvitation = function (user) {
    IMC.sendingInviteUserId = user.id;
    IMC.sendingInvitation = true;
    IMC.setActiveUserId(null);
    return $q.all({
      user: fetchUser(),
      githubOrgId: fetchGithubOrgId(teamName)
    })
    .then(function (response) {
      IMC.invitesSent += 1;
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
      user.inviteSent = true;
      // Append invitation to user
      user.userInvitation = invitationModel;
      $rootScope.$broadcast('newInvitedAdded', user);
      IMC.sendingInvitation = false;
      IMC.sendingInviteUserId = null;
      if (IMC.unInvitedMembers.length === 0) {
        // Close the modal if there are no more invitations left
        IMC.close();
      }
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
    close(!!IMC.invitesSent);
  };
}
