'use strict';

require('app')
  .directive('instanceHeader', instanceHeader);

/**
 * @ngInject
 */
function instanceHeader(
  $localStorage,
  $rootScope,
  $stateParams,
  fetchPullRequest,
  ahaGuide
) {
  return {
    restrict: 'A',
    templateUrl: 'instanceHeaderView',
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
      $scope.toggleSidebar = function () {
        console.log('Show aha sidebar');
        $rootScope.$broadcast('showAhaSidebar');
      };
      $scope.isInGuide = ahaGuide.isInGuide;
    }
  };
}
