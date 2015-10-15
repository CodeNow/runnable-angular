'use strict';

require('app')
  .directive('instanceHeader', instanceHeader);

/**
 * @ngInject
 */
function instanceHeader(
  $localStorage,
  $stateParams,
  $rootScope,
  fetchPullRequest
) {
  return {
    restrict: 'A',
    templateUrl: function () {
      if ($rootScope.featureFlags.newNavigation) {
        return 'instanceHeaderView';
      }
      return 'viewInstancePrimaryActions';
    },
    scope: {
      instance: '=',
      openItems: '='
    },
    link: function ($scope) {
      $scope.$storage = $localStorage;
      $scope.userName = $stateParams.userName;
      $scope.$watch('instance', function (newValue) {
        if (!newValue) {
          return;
        }
        fetchPullRequest($scope.instance)
          .then(function (pr) {
            if (pr) {
              $scope.pr = pr;
            }
          });
      });
    }
  };
}
