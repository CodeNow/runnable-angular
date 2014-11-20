require('app')
  .directive('linkedInstances', linkedInstances);

function linkedInstances (
  $rootScope
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
    replace: true,
    scope: {
      forkDependencies: '=',
      instanceDependencies: '=',
      instances: '=' // For dupe checking
    },
    link: function ($scope, elem, attrs) {
      $scope.forkDependencies = true;

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