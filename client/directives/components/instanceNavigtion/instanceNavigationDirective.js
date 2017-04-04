'use strict';

require('app').directive('instanceNavigation', instanceNavigation);

function instanceNavigation(
  $state,
  getNavigationName,
  isInstanceActive
) {
  return {
    restrict: 'A',
    templateUrl: 'instanceNavigationView',
    controller: 'InstanceNavigationController',
    controllerAs: 'INC',
    bindToController: true,
    scope: {
      instance: '=',
      masterInstance: '=?'
    },
    link: function ($scope) {
      $scope.$state = $state;

      $scope.getNavigationName = function () {
        return getNavigationName($scope.INC.instance);
      };

      $scope.isActive = function () {
        if (isInstanceActive($scope.INC.instance)) {
         return {
           active: true
         };
        }
      };
    }
  };
}
