require('app')
  .directive('linkedInstances', linkedInstances);

function linkedInstances (
  $rootScope,
  getInstanceClasses,
  getInstanceAltTitle
) {
  return {
    restrict: 'E',
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
      isActive: '=',
      instances: '=' // For dupe checking
    },
    link: function ($scope, elem, attrs) {
      // Since we should allow isActive to be null, we explicitly check against false
      if ($scope.isActive === false) { return; }
      $scope.getInstanceAltTitle = getInstanceAltTitle;
      $scope.getInstanceClasses = getInstanceClasses;

      $scope.$watch('instanceDependencies', function (n) {
        if (!n) { return; }
        $scope.instanceDependencies.models.forEach(function (model) {
          model.fetch(function () {
            $rootScope.safeApply();
          });
        });
      });

    }
  };
}