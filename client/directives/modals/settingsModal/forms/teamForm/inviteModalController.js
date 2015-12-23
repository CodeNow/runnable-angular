'use strict';

require('app')
  .controller('InviteModalController', InviteModalController);

/**
 * @ngInject
 */
function InviteModalController(
  $rootScope,
  errs,
  inviteGithubUserToRunnable,
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

  IMC.sendInvitation = function (user) {
    IMC.sendingInviteUserId = user.id;
    IMC.setActiveUserId(null);
    return inviteGithubUserToRunnable(user.id, user.inviteEmail, teamName)
      .then(function (invitationModel) {
        IMC.invitesSent += 1;
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
    close(!!IMC.invitesSent);
  };
}
