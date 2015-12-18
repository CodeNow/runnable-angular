'use strict';

require('app')
  .directive('userInvitationPopover', userInvitationPopover);

function userInvitationPopover(

) {
  return {
    restrict: 'A',
    templateUrl: 'userInvitationPopover',
    scope: {
    },
    link: function ($scope) {

    }
}
