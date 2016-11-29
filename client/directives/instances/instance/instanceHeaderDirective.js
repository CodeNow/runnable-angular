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
  fetchPullRequest
) {
  return {
    restrict: 'A',
    templateUrl: 'instanceHeaderView',
    scope: {
      instance: '=',
      openItems: '=',
      showUrlCallout: '=?'
    },
    link: function ($scope) {
      console.log('DIRECTIVE showUrlCallout', $scope.showUrlCallout);
      console.log('DIRECTIVE instance', $scope.instance);
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
      $scope.isInGuide = ahaGuide.isInGuide;
    }
  };
}
