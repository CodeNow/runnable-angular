'use strict';

require('app')
  .directive('serverStatusCardHeader', serverStatusCardHeader);
/**
 * @ngInject
 */
function serverStatusCardHeader(
  $rootScope
) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: function (elem, attrs) {
      if ($rootScope.featureFlags.cardStatus) {
        return 'serverStatusCardHeaderViewCardStatus';
      }
      return 'serverStatusCardHeaderView';
    },
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
            } else {
              $scope.popOverServerData.advanced = $scope.state.advanced;
            }
          }
        }
      };
      $scope.$watch('state.advanced', function (advanced) {
        $scope.popOverServerData.advanced = advanced;
      });

      attrs.$observe('noTouching', function () {
        $scope.noTouching = attrs.noTouching === 'true';
      });

    }
  };
}
