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
      user: '=',
      commit: '='
    },
    link: function ($scope) {

      function commitWatchHandler () {
        if (!$scope.user && $scope.commit) {
          $scope.UBC.fetchUserForCommit($scope.commit)
            .then(function (user) {
              $scope.user = user;
            });
        }
      }
    }
  };
}
