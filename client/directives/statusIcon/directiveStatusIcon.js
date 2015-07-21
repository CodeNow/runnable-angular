'use strict';

require('app')
  .directive('statusIcon', statusIcon);

function statusIcon(
  getInstanceClasses,
  watchOncePromise
) {
  return {
    restrict: 'E',
    scope: {
      instance: '='
    },
    replace: true,
    templateUrl: 'viewStatusIcon',
    link: function ($scope) {

      $scope.instanceClasses = {};

      watchOncePromise($scope, 'instance', true)
        .then(function () {
          $scope.instanceClasses = getInstanceClasses($scope.instance);
          if ($scope.instance.on) {
            var handleInstanceUpdate = function () {
              $scope.$applyAsync(function () {
                $scope.instanceClasses = getInstanceClasses($scope.instance);
              });
            };
            $scope.instance.on('update', handleInstanceUpdate);
            $scope.$on('$destroy', function () {
              if ($scope.instance.off) {
                $scope.instance.off('update', handleInstanceUpdate);
              }
            });
          }
        });
    }
  };
}