require('app')
  .directive('setupStackDependencies', setupStackDependencies);
/**
 * @ngInject
 */
function setupStackDependencies(
  keypather,
  fetchGSDepInstances,
  getNewForkName
) {
  return {
    restrict: 'A',
    templateUrl: 'viewSetupStackDependencies',
    scope: {
      instanceList: '=',
      dependencies: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
      keypather.set($scope, 'actions.addDep', function (instance) {
        console.log('Add Model', instance);
        $scope.state.dependencies.models.push({
          instance: instance,
          opts: {
            name: getNewForkName(instance, $scope.instanceList, true),
            env: instance.attrs.env
          }
        });
      });
      $scope.$watch('state.dependencies.models.length', function (n) {
        if (n) {
          $scope.state.dependencies.models.forEach(function (model) {
            if (!model.reqEnvs) {
              var envs = keypather.get(model, 'instance.containers.models[0].urls()');
              if (envs && envs.length) {
                model.reqEnvs = [];
                envs.forEach(function(url, index) {
                  model.reqEnvs.push({
                    name: model.instance.attrs.name + (index > 0 ? index : ''),
                    url: url.replace(model.instance.attrs.name, model.opts.name)
                  });
                });
              }
            }
          });
        }
      });

      keypather.set($scope, 'actions.removeDep', function (instance) {
        console.log('remove Model', instance);
        $scope.state.dependencies.models = $scope.state.dependencies.models.filter(function (item) {
          return item.instance !== instance;
        });
      });

      fetchGSDepInstances(function (err, deps) {
        keypather.set($scope, 'addDependencyPopover.data.dependencies', deps);
      });
      keypather.set($scope, 'addDependencyPopover.data.state.dependencies',
        $scope.state.dependencies);
    }
  };
}
