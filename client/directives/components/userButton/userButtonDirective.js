'use strict';

require('app')
  .directive('userButton', userButton);

function userButton () {
  return {
    restrict: 'A',
    controller: 'UserButtonController',
    controllerAs: 'UBC',
    replace: true,
    templateUrl: 'userButtonView',
    scope: {
      commit: '='
    },
    link: function ($scope) {
      $scope.loading = true;
      // Listen for changes in the commit
      $scope.$watch('commit', function updateCommitUser () {
        return $scope.UBC.fetchUserForCommit($scope.commit)
          .then(function (user) {
            $scope.commitUser = user;
            $scope.loading = false;
          });
      });

      $scope.ifShowInviteFormAndInviteNotSent = function () {
        var user = $scope.commitUser;
        return user.showInviteForm && !user.inviteSent && !user.inviteSending;
      };

      $scope.ifNotShowInviteFormAndNotRunnableUser = function () {
        var user = $scope.commitUser;
        return !user.inviteSending && !user.inviteSent && !user.showInviteForm && !user.isRunnableUser;
      };
    }
  };
}
