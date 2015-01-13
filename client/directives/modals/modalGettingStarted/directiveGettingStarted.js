'use strict';

require('app')
  .directive('modalGettingStarted', modalGettingStarted);
/**
 * directive modalGettingStarted
 * @ngInject
 */
function modalGettingStarted(
  $rootScope,
  $log,
  async,
  createDockerfileFromSource,
  errs,
  getNewForkName,
  fetchGSDepInstances,
  gsPopulateDockerfile,
  createNewInstance,
  fetchUser,
  keypather,
  createNewBuild
) {
  return {
    restrict: 'E',
    templateUrl: 'viewModalGettingStarted',
    scope: {
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {

      $scope.actions = {
        addDependency: function (instance) {
          var envs = keypather.get(instance, 'containers.models[0].urls()') || [];
          var newName = getNewForkName(instance, $scope.instanceList, true);
          $scope.state.dependencies.push({
            instance: instance,
            opts: {
              name: newName,
              env: instance.attrs.env
            },
            reqEnv: envs.map(function (url, index) {
              return {
                name: instance.attrs.name.toUpperCase() + '_HOST' + (index > 0 ? index : ''),
                url: url.replace(instance.attrs.name, newName)
              };
            })
          });
        },
        removeDependency: function (model) {
          var index = $scope.state.dependencies.indexOf(model);
          $scope.state.dependencies.splice(index, 1);
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
      //var unwatch = $rootScope.$watch('dataApp.data.activeAccount', function (n) {
      //  if (n) {
      //    unwatch();
      //    createNewBuild(n, function (err, build) {
      //      if (err) {
      //        return errs.handler(err);
      //      }
      //      $scope.build = build;
      //    });
      //  }
      //});
      fetchGSDepInstances(function (err, deps) {
        if (err) { return errs.handler(err); }
        keypather.set($scope, 'data.allDependencies', deps);
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

      keypather.set($scope, 'actions.createAndBuild', function() {
        // first thing to do is generate the dockerfile
        $scope.$watch('dockerfile', function (n) {
          if (n) {
            $rootScope.dataApp.data.loading = true;
            $scope.state.opts.env = generateEnvs($scope.state.dependencies);
            $log.log('ENVS: \n' + $scope.state.opts.env);
            async.series([
              gsPopulateDockerfile(n, $scope.state),
              forkInstances($scope.state.dependencies),
              createNewInstance
            ], errs.handler);
          }
        });
      });


      function generateEnvs(depModels) {
        var envList = [];
        depModels.forEach(function(item) {
          if (item.reqEnvs) {
            item.reqEnvs.forEach(function(env) {
              envList.push(env.name + '=' + env.url);
            });
          }
        });
        return envList;
      }

      function forkInstances(items) {
        //$rootScope.dataApp.data.loading = true;
        function fork(instance, opts, cb) {
          instance.copy(opts, cb);
        }

        return function (cb) {
          var parallelFunctions = items.map(function (item) {
            return function (cb) {
              fork(item.instance, item.opts, cb);
            };
          });
          async.parallel(parallelFunctions, cb);
        };
      }
    }
  };
}