'use strict';

require('app')
  .directive('serverStatusCardHeader', serverStatusCardHeader);
/**
 * @ngInject
 */
function serverStatusCardHeader(
  $rootScope,
  keypather
) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'serverStatusCardHeaderView',
    link: function ($scope, elem, attrs) {
      $scope.popOverServerData = {
        instance: $scope.instance,
        actions: {
          changeAdvancedFlag: function () {
            $rootScope.$broadcast('close-popovers');
            if (confirm($scope.state.advanced ?
                  'You will lose all changes you\'ve made to your dockerfile (ever).' :
                  'If you make changes to the build files, you will not be able to ' +
                  'switch back without losing changes.')) {
              $scope.state.advanced = !$scope.state.advanced;
            }
            $scope.popOverServerData.advanced = $scope.state.advanced;
          }
        }
      };
      if ($scope.state) {
        $scope.popOverServerData.advanced = $scope.state.advanced;
      }

      $scope.$watch(function () {
        return attrs.noTouching === 'true';
      }, function (n) {
        $scope.noTouching = n;
      });

    }
  };
}
