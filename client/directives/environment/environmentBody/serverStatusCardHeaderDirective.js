'use strict';

require('app')
  .directive('serverStatusCardHeader', serverStatusCardHeader);
/**
 * @ngInject
 */
function serverStatusCardHeader(
  $rootScope,
  $timeout,
  promisify,
  helpCards,
  keypather,
  errs
) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'serverStatusCardHeaderView',
    link: function ($scope, elem, attrs) {
      $scope.popOverServerData = {
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
          },
          deleteServer: function (instance) {
            $rootScope.$broadcast('close-popovers');
            $timeout(function () {
              if (confirm('Are you sure you want to delete this container?')) {
                promisify(instance, 'destroy')()
                  .catch(errs.handler);
                helpCards.refreshAllCards();
              }
            });
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
