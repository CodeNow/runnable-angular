'use strict';

require('app')
  .directive('linkedInstances', linkedInstances);

function linkedInstances(
  errs,
  $rootScope,
  getInstanceClasses,
  getInstanceAltTitle
) {
  return {
    restrict: 'EA',
    templateUrl: function (elem, attrs) {
      if (attrs.type === 'modal') {
        return 'viewLinkedInstancesModal';
      } else if (attrs.type === 'sidebar') {
        return 'viewLinkedInstancesSidebar';
      } else {
        throw new Error('linkedInstances requires a type of modal or sidebar');
      }
    },
    // Needs to be replace: false due to bug in Angular
    // ng-repeat on root element is tricksy
    // https://github.com/angular/angular.js/issues/2151
    replace: false,
    scope: {
      forkDependencies: '=',
      instanceDependencies: '=',
      showTeamIcon: '=',
      items: '=',
      stateToInstance: '=',
      instances: '=' // For dupe checking
    },
    link: function ($scope, elem, attrs) {
      $scope.getInstanceAltTitle = getInstanceAltTitle;
      $scope.getInstanceClasses = getInstanceClasses;
      $scope.$watch('instanceDependencies', function (n) {
        if (!n) { return; }
        $scope.instanceDependencies.models.forEach(function (model) {
          model.fetch(errs.handler);
        });
      });

    }
  };
}
