'use strict';

require('app')
  .controller('InviteModalController', InviteModalController);

/**
 * @ngInject
 */
function InviteModalController(
  unInvitedMembers,
  close
) {
  var IMC = this;
  angular.extend(IMC, {
    unInvitedMembers: unInvitedMembers,
    close: close
  });
}
