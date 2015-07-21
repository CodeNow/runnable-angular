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
            $scope.instance.on('update:socket', function () {
              $scope.instanceClasses = getInstanceClasses($scope.instance);
            });
          }
        });
    }
  };
}
