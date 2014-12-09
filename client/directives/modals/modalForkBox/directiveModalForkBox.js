require('app')
  .directive('modalForkBox', modalForkBox);
/**
 * directive modalForkBox
 * @ngInject
 */
function modalForkBox(
  getNewForkName,
  updateEnvName,
  keypather,
  $rootScope
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
      $scope.$watch('data.newForkName', function (n, o) {
        if (!n || n === o || !keypather.get($scope, 'data.instance.dependencies.models.length')) {
          return;
        }
        keypather.set($scope.data.instance, 'state.name', n);
        updateEnvName($scope.data.instance, n, o, $scope.data.instance);
        $rootScope.safeApply();
      });
      $scope.data.newForkName = getNewForkName($scope.data.instance, $scope.data.instances);
      updateEnvName(
        $scope.data.instance,
        $scope.data.newForkName,
        $scope.data.instance.attrs.name,
        $scope.data.instance
      );
      $scope.$watch('data.forkDependencies', function (n, o) {
        if (n === o) { return; }
        // If the forkDeps checkbox changed, just set the dependencies' state.name back to the
        // original
        if (!n) {
          $scope.data.instance.dependencies.models.forEach(function (instance, idx) {
            // Save the current state.name in previousState.name
            keypather.set($scope, 'previousState[' + idx + '].name', instance.state.name);
            // Then set the state.name to the original, which should fire off the watcher below
            keypather.set(instance, 'state.name', instance.attrs.name);
          });
        } else if (n) {
          $scope.data.instance.dependencies.models.forEach(function (instance, idx) {
            // Set the state.name to the previous
            if (keypather.get($scope, 'previousState[' + idx + '].name')) {
              keypather.set(instance, 'state.name',
                keypather.get($scope, 'previousState[' + idx + '].name'));
            }
          });
        }
        $rootScope.safeApply();
      });

      var depWatch = $scope.$watch('data.instance.dependencies', function (n) {
        if (!n) {
          return;
        }
        // Cancel watch, it's served its purpose
        depWatch();
        if (!keypather.get($scope, 'data.instance.dependencies.models.length')) {
          return;
        }
        $scope.data.instance.dependencies.models.forEach(function (instance, idx) {
          var newName = getNewForkName(instance, $scope.data.instances);
          $scope.$watch('data.instance.dependencies.models[' + idx + '].state.name', function (n, o) {
            if (n === o) {
              return;
            }
            if (!n) {
              keypather.set($scope, 'previousState[' + idx + '].name', o);
              // We don't want to set the name to empty if they just cleared the env
              return;
            }
            if (!o) {
              // If the old name was empty, use the name we previously saved
              // This is useful when the user fully deletes what's in the name box, then changes it
              o = keypather.get($scope, 'previousState[' + idx + '].name');
            }
            updateEnvName(instance, n, o, $scope.data.instance);
            $rootScope.safeApply();
          });
          keypather.set(instance, 'state.name', newName);
          updateEnvName(instance, newName, instance.attrs.name, $scope.data.instance);
          $rootScope.safeApply();
        });
      });

      $scope.$on('$destroy', function () {
        if (keypather.get($scope, 'data.instance.dependencies.models.length')) {
          $scope.data.instance.dependencies.models.forEach(function (instance, idx) {
            delete instance.state.env;
            //delete instance.state.name;
          });
        }
        if (keypather.get($scope, 'data.instance.state')) {
          delete $scope.data.instance.state.env;
        }
        //delete $scope.data.instance.state.name;
      });
    }
  };
}