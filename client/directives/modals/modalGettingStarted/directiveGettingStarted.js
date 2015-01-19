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
  fetchInstances,
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
          var newName = getNewForkName(instance, $scope.data.instances, true);
          var envName = instance.attrs.name.replace(/-/gm, '_').toUpperCase();
          $scope.state.dependencies.push({
            instance: instance,
            opts: !fromExisting ? {
              name: newName,
              env: instance.attrs.env
            } : null,
            reqEnv: envs.map(function (url, index) {
              var thisEnvName = envName + '_HOST' + (index > 0 ? index : '');
              return {
                name: thisEnvName,
                placeholder: thisEnvName,
                url: !fromExisting ? url.replace(instance.attrs.name, newName) : url
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
                userName: $scope.data.activeAccount.oauthName()
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
                }, $scope.data.instances, true);
              $log.log('ENVS: \n' + $scope.state.opts.env);
              async.waterfall([
                createAppCodeVersions(
                  $scope.contextVersion,
                  $scope.state.selectedRepo,
                  $scope.state.activeBranch
                ),
                gsPopulateDockerfile(n, $scope.state),
                createNewInstance(
                  $scope.data.activeAccount,
                  $scope.build,
                  $scope.state.opts,
                  $scope.data.instances
                ),
                forkInstances($scope.state.dependencies),
                function () {
                  $rootScope.dataApp.data.loading = false;
                  $scope.defaultActions.close();
                  $timeout(function () {
                    $state.go('instance.instance', {
                      userName: $scope.data.activeAccount.oauthName(),
                      instanceName: $scope.state.opts.name
                    });
                  });
                }
              ], function (err) {
                $scope.building = false;
                errs.handler(err);
                createNewBuild($scope.data.activeAccount, function (err, build, version) {
                  if (err) {
                    $rootScope.dataApp.data.loading = false;
                    return errs.handler(err);
                  }
                  $scope.build = build;
                  $scope.contextVersion = version;
                  createDockerfileFromSource(
                    version,
                    $scope.state.stack.key,
                    function (err, dockerfile) {
                      $rootScope.dataApp.data.loading = false;
                      if (err) {
                        return errs.handler(err);
                      }
                      $scope.dockerfile = dockerfile;
                    }
                  );
                });
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
          createDockerfileFromSource($scope.contextVersion, n.key, function (err, dockerfile) {
            if (err) {
              return errs.handler(err);
            }
            $scope.dockerfile = dockerfile;
          });
        }
      });

      $scope.$watch('data.activeAccount', function (user) {
        if (user) {
          createNewBuild(user, function (err, build, version) {
            $scope.build = build;
            $scope.contextVersion = version;
          });
          $scope.state.stack = null;
          $scope.state.dependencies = [];
          fetchInstances(user.oauthName(), null, function (err, instances) {
            $scope.data.instances = instances;
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