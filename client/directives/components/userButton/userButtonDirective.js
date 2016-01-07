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
        if (typeof $scope.commit !== 'object') {
          return;
        }
        return $scope.UBC.fetchUserForCommit($scope.commit)
          .then(function (user) {
            $scope.commitUser = user;
            $scope.loading = false;
          });
      });
   }
  };
}
