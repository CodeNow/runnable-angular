require('app')
  .directive('modalGettingStarted', modalGettingStarted);
/**
 * directive modalGettingStarted
 * @ngInject
 */
function modalGettingStarted(
  $rootScope,
  async,
  createDockerfileFromSource,
  errs,
  getNewForkName,
  fetchGSDepInstances,
  fetchInstances,
  fetchStackInfo,
  fetchUser,
  keypather,
  createNewBuild
) {
  return {
    restrict: 'E',
    templateUrl: 'viewModalGettingStarted',
    scope: {},
    link: function ($scope, element, attrs) {

      $scope.actions = {
        addDependency: function (instance) {
          console.log('Add Model', instance);
          var envs = keypather.get(instance, 'containers.models[0].urls()') || [];
          var newName = getNewForkName(instance, $scope.instanceList, true);
          $scope.state.dependencies.push({
            instance: instance,
            opts: {
              name: newName,
              env: instance.attrs.env,
              reqEnv: envs.map(function (url, index) {
                return {
                  name: instance.attrs.name + (index > 0 ? index : ''),
                  url: url.replace(instance.attrs.name, newName)
                };
              })
            }
          });
        },
        removeDependency: function (index) {
          $scope.state.dependencies.models.splice(index, 1);
        }
      };
      $scope.state = {
        unsavedAcvs: [],
        dependencies: [],
        opts: {
          name: 'NewInstance'
        },
        step: 1
      };
      createNewBuild($rootScope.dataApp.data.activeAccount, function (err, build) {
        if (err) { return errs.handler(err); }
        $scope.build = build;
      });
      fetchGSDepInstances(function (err, deps) {
        if (err) { return errs.handler(err); }
        keypather.set($scope, 'allDependencies', deps);
      });
      $scope.$watch('state.stack.name', function (n) {
        if (n) {
          createDockerfileFromSource($scope.build, n, function (err, dockerfile) {
            if (err) {
              return errs.handler(err);
            }
            $scope.dockerfile = dockerfile;
          });
        }
      });


      function forkInstances(items, cb) {
        //$rootScope.dataApp.data.loading = true;
        function fork(instance, opts, cb) {
          instance.copy(opts, cb);
        }

        var parallelFunctions = items.map(function (item) {
          return function (cb) {
            fork(item.instance, item.opts, cb);
          };
        });
        async.parallel(parallelFunctions, cb);
      }
    }
  };
}