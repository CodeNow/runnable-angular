'use strict';

require('app')
  .directive('instanceHeader', instanceHeader);

/**
 * @ngInject
 */
function instanceHeader(
  $localStorage,
  $stateParams,
  ahaGuide,
  eventTracking,
  fetchPullRequest,
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'instanceHeaderView',
    scope: {
      instance: '=',
      openItems: '=',
      demoFlowFlags: '=?'
    },
    link: function ($scope) {
      $scope.$storage = $localStorage;
      $scope.userName = $stateParams.userName;
      $scope.openedPRUrl = eventTracking.openedPRUrl;
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
      $scope.isInGuide = ahaGuide.isInGuide;
    }
  };
}
