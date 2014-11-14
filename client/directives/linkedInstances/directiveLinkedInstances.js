require('app')
  .directive('linkedInstances', linkedInstances);

function linkedInstances (
  async,
  user
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
      instanceDependencies: '='
    },
    link: function ($scope, elem, attrs) {
      if (!$scope.instanceDependencies) {
        // The instance did not have any dependencies
        return;
      }

      $scope.linkedBoxesChecked = true;

      console.log('has deps');
    }
  };
}