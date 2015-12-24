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
    invitesSent: false
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
