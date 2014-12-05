require('app')
  .directive('modalForkBox', modalForkBox);
/**
 * directive modalForkBox
 * @ngInject
 */
function modalForkBox(
  getNewForkName,
  updateEnvName,
  keypather
) {
  return {
    restrict: 'E',
    templateUrl: 'viewModalForkBox',
    replace: true,
    scope: {
      data: '=',
      actions: '=',
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {
      $scope.data.newForkName = getNewForkName($scope.data.instance, $scope.data.instances);
      $scope.data.forkDependencies = true;

      $scope.$watch('data.newForkName', function(n, o) {
        if (!n || !keypather.get($scope, 'data.instance.dependencies.models.length')) { return; }

        $scope.data.instance.dependencies.models.forEach(function(instance) {
          updateEnvName(instance, n, o, $scope.data.instance);
        });
      });
      var depWatch = $scope.$watch('data.instance.dependencies', function(n) {
        if (!n) { return; }
        // Cancel watch, it's served its purpose
        depWatch();
        $scope.data.instance.dependencies.models.forEach(function(instance, idx) {
          var newName = getNewForkName(instance, $scope.data.instances);
          $scope.$watch('data.instance.dependencies.models[' + idx + '].state.name', function(n, o) {
            if (!n || n === o) { return; }
            updateEnvName(instance, n, o, $scope.data.instance);
          });
          keypather.set(instance, 'state.name', newName);
          updateEnvName(instance, newName, instance.attrs.name, $scope.data.instance);
        });
      });

      $scope.$on('$destroy', function() {
        console.log('fork Modal Destroyed');
      });
    }
  };
}