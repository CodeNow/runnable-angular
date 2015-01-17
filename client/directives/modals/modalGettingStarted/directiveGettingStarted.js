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
  $timeout,
  async,
  createDockerfileFromSource,
  errs,
  getNewForkName,
  fetchGSDepInstances,
  gsPopulateDockerfile,
  createNewInstance,
  $state,
  $stateParams,
  fetchStackInfo,
  fetchUser,
  keypather,
  createNewBuild
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalGettingStarted',
    scope: {
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {
      var unwatchUserInfo = $rootScope.$watch('dataApp.data.activeAccount', function (n) {
        if (n) {
          keypather.set($scope, 'data.activeAccount', n);
          keypather.set($scope, 'data.orgs', $rootScope.dataApp.data.orgs);
          keypather.set($scope, 'data.user', $rootScope.dataApp.data.user);
        }
      });
      var unwatchInstances = $rootScope.$watch('dataApp.data.instances', function (n) {
        if (n) {
          unwatchInstances();
          $scope.state.hideCancelButton = !n.models.length;
        }
      });
      $scope.$on('$destroy', function () {
        unwatchInstances();
        unwatchUserInfo();
      });

      $scope.actions = {
        addDependency: function (instance, fromExisting) {
          var envs = keypather.get(instance, 'containers.models[0].urls()') || [];
          var newName = getNewForkName(instance, $rootScope.dataApp.data.instances, true);
          var envName = instance.attrs.name.replace(/-/gm, '_').toUpperCase();
          $scope.state.dependencies.push({
            instance: instance,
            opts: !fromExisting ? {
              name: newName,
              env: instance.attrs.env
            } : null,
            reqEnv: envs.map(function (url, index) {
              return {
                name: envName + '_HOST' + (index > 0 ? index : ''),
                placeholder: envName + '_HOST' + (index > 0 ? index : ''),
                url: url.replace(instance.attrs.name, newName)
              };
            })
          });
        },
        removeDependency: function (model) {
          var index = $scope.state.dependencies.indexOf(model);
          $scope.state.dependencies.splice(index, 1);
        },
        changeStep: function (newStep) {
          $scope.state.repoSelected = false;
          if ($scope.state.furthestStep >= newStep) {
            $scope.state.step = newStep;
          }
        },
        nextStep: function (newStep) {
          $scope.state.furthestStep = newStep;
          $scope.state.step = newStep;
        },
        skipTutorial: function () {
          $scope.defaultActions.close(function () {
            setTimeout(function() {
              $state.go('instance.new', {
                userName: $stateParams.userName
              });
            }, 0);
          });
        },
        createAndBuild: function() {
          if ($scope.building) { return; }
          $scope.building = true;
          // first thing to do is generate the dockerfile
          $rootScope.dataApp.data.loading = true;
          $scope.$watch('dockerfile', function (n) {
            if (n) {
              $scope.state.opts.env = generateEnvs($scope.state.dependencies);
              $scope.state.opts.name =
                getNewForkName({
                  attrs: {
                    name: $scope.state.selectedRepo.attrs.name
                  }
                }, $rootScope.dataApp.data.instances, true);
              $log.log('ENVS: \n' + $scope.state.opts.env);
              async.waterfall([
                createAppCodeVersions(
                  $scope.contextVersion,
                  $scope.state.selectedRepo,
                  $scope.state.activeBranch
                ),
                gsPopulateDockerfile(n, $scope.state),
                createNewInstance(
                  $rootScope.dataApp.data.activeAccount,
                  $scope.build,
                  $scope.state.opts,
                  $rootScope.dataApp.data.instances
                ),
                forkInstances($scope.state.dependencies),
                function () {
                  $rootScope.dataApp.data.loading = false;
                  $scope.defaultActions.close();
                  $timeout(function () {
                    $state.go('instance.instance', {
                      userName: $stateParams.userName,
                      instanceName: $scope.state.opts.name
                    });
                  });
                }
              ], function (err) {
                $scope.building = false;
                $rootScope.dataApp.data.loading = false;
                errs.handler(err);
              });
            }
          });
        }
      };
      $scope.state = {
        dependencies: [],
        opts: {
          name: 'NewInstance'
        },
        step: 1,
        furthestStep: 1
      };
      keypather.set($scope, 'data.accountsDisabled', function () {
        return $scope.state.step > 1;
      });
      fetchGSDepInstances(function (err, deps) {
        if (err) { return errs.handler(err); }
        keypather.set($scope, 'data.allDependencies', deps);
      });
      fetchStackInfo(function (err, body) {
        if (err) { return errs.handler(err); }
        keypather.set($scope, 'data.stacks', body);
      });
      $scope.$watch('state.stack', function (n) {
        if (n) {
          createNewBuild($rootScope.dataApp.data.activeAccount, function (err, build, version) {
            $scope.build = build;
            $scope.contextVersion = version;
            createDockerfileFromSource(version, n.key, function (err, dockerfile) {
              if (err) {
                return errs.handler(err);
              }
              $scope.dockerfile = dockerfile;
            });
          });
        }
      });

      function generateEnvs(depModels) {
        var envList = [];
        depModels.forEach(function (item) {
          if (item.reqEnv) {
            item.reqEnv.forEach(function (env) {
              envList.push((env.name || env.placeholder) + '=' + env.url);
            });
          }
        });
        return envList;
      }

      function createAppCodeVersions(version, repo, branch) {
        return function (cb) {
          var latestCommit = branch.commits.models[0];
          version.appCodeVersions.create({
            repo: repo.attrs.full_name,
            branch: branch.attrs.name,
            commit: latestCommit.attrs.sha
          }, function (err) {
            cb(err);
          });
        };
      }

      function forkInstances(items) {
        //$rootScope.dataApp.data.loading = true;
        function fork(instance, opts, cb) {
          instance.copy(opts, cb);
        }

        return function (cb) {
          var parallelFunctions = items.map(function (item) {
            return function (cb) {
              if (item.opts) {
                fork(item.instance, item.opts, cb);
              } else {
                cb();
              }
            };
          });
          async.parallel(parallelFunctions, function (err) {
            cb(err);
          });
        };
      }
    }
  };
}