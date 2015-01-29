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
  callbackCount,
  copySourceInstance,
  errs,
  getNewForkName,
  regexpQuote,
  gsPopulateDockerfile,
  createNewInstance,
  $state,
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
          unwatchUserInfo();
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
          var envName = instance.attrs.name.replace(/-/gm, '_').toUpperCase();
          $scope.state.dependencies.push({
            instance: instance,
            opts: !fromExisting ? {
              env: instance.attrs.env,
              owner: {
                github: $scope.data.activeAccount.oauthId()
              }
            } : null,
            reqEnv: envs.map(function (url, index) {
              var thisEnvName = envName + '_HOST' + (index > 0 ? index : '');
              return {
                name: thisEnvName,
                placeholder: thisEnvName,
                url: url,
                originalUrl: url
              };
            })
          });
        },
        removeDependency: function (model) {
          var index = $scope.state.dependencies.indexOf(model);
          $scope.state.dependencies.splice(index, 1);
        },
        changeStep: function (newStep) {
          if (newStep === 1) {
            $scope.state.repoSelected = false;
          }
          if ($scope.state.furthestStep >= newStep) {
            $scope.state.step = newStep;
          }
        },
        nextStep: function (newStep) {

          if ($scope.state.furthestStep < newStep) {
            $scope.state.furthestStep = newStep;
          }
          $scope.state.step = newStep;
        },
        skipTutorial: function () {
          $scope.defaultActions.close(function () {
            $timeout(function () {
              $state.go('instance.new', {
                userName: $scope.data.activeAccount.oauthName()
              });
            });
          });
        },
        createAndBuild: function() {
          if ($scope.building) { return; }
          $scope.building = true;
          // first thing to do is generate the dockerfile
          $rootScope.dataApp.data.loading = true;
          var unwatchDf = $scope.$watch('state.dockerfile', function (n) {
            if (!n) { return; }
            unwatchDf();
            var unwatchInstances = $scope.$watch('data.instances', function (n) {
              if (!n) { return; }
              unwatchInstances();
              generateDependenciesNames();
              $scope.state.opts.env = generateEnvs($scope.state.dependencies);
              $scope.state.opts.name =
                getNewForkName({
                  attrs: {
                    name: $scope.state.selectedRepo.attrs.name
                  }
                }, $scope.data.instances, true).replace(/\W/gim, '_');
              async.waterfall([
                createAppCodeVersions(
                  $scope.state.contextVersion,
                  $scope.state.selectedRepo,
                  $scope.state.activeBranch
                ),
                gsPopulateDockerfile(
                  $scope.state.dockerfile,
                  $scope.state
                ),
                forkInstances($scope.state.dependencies),
                createNewInstance(
                  $scope.data.activeAccount,
                  $scope.state.build,
                  $scope.state.opts,
                  $scope.data.instances
                ),
                function (cb) {
                  $rootScope.dataApp.data.loading = false;
                  var newStateParams = {
                    userName: $scope.data.activeAccount.oauthName(),
                    instanceName: $scope.state.opts.name
                  };
                  $scope.defaultActions.close(function () {
                    $scope.$emit('INSTANCE_LIST_FETCH', newStateParams.userName);
                    cb(null, newStateParams);
                  });
                },
                function (newStateParams) {
                  $timeout(function () {
                    $state.go('instance.instance', newStateParams);
                  }, 10);
                }
              ], function (err) {
                $scope.building = false;
                errs.handler(err);
                resetModalData($scope.data.activeAccount, true, function (err) {
                  if (err) {
                    $rootScope.dataApp.data.loading = false;
                    $timeout(angular.noop);
                    return errs.handler(err);
                  }
                  createDockerfileFromSource(
                    $scope.state.contextVersion,
                    $scope.state.stack.key,
                    function (err, dockerfile) {
                      $rootScope.dataApp.data.loading = false;
                      if (err) {
                        return errs.handler(err);
                      }
                      $scope.state.dockerfile = dockerfile;
                    }
                  );
                });
              });
            });
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
      fetchInstances({
        githubUsername: 'HelloRunnable'
      }).then(function (deps) {
        keypather.set($scope, 'data.allDependencies', deps);
      }).catch(errs.handler);
      fetchStackInfo(function (err, stacks) {
        if (err) { return errs.handler(err); }
        keypather.set($scope, 'data.stacks', stacks);
      });

      $scope.$watch('state.stack', function (n) {
        if (n) {
          var unwatchCv = $scope.$watch('state.contextVersion', function (contextVersion) {
            if (contextVersion) {
              unwatchCv();
              createDockerfileFromSource(contextVersion, n.key, function (err, dockerfile) {
                if (err) {
                  return errs.handler(err);
                }
                $scope.state.dockerfile = dockerfile;
              });
            }
          });
        }
      });

      $scope.$watch('data.activeAccount', function (user, oldUser) {
        if (user) {
          if (user !== oldUser) {
            $scope.state = {
              dependencies: [],
              opts: {},
              step: 1,
              furthestStep: 1
            };
            $scope.data.instances = null;
          }
          resetModalData(user);
        }
      });

      function resetModalData(user, forceInstanceFetch, cb) {
        var counter = (cb) ? callbackCount(2, cb) : null;
        $scope.state.build = null;
        $scope.state.contextVersion = null;
        $scope.state.dockerfile = null;
        $scope.data.instances = null;
        createNewBuild(user, function (err, build, version) {
          $scope.state.build = build;
          $scope.state.contextVersion = version;
          if (counter) {
            counter.next(err);
          }
        });
        fetchInstances().then(function (instances) {
          $scope.data.instances = instances;
          if (counter) {
            counter.next();
          }
        }).catch(function(err) {
          if (counter) {
            counter.next(err);
          }
        });
      }

      function generateDependencyName(item) {
        var newName = getNewForkName(item.instance, $scope.data.instances, true);
        item.opts.name = newName;
        item.reqEnv.forEach(function (env) {
          env.url = env.originalUrl.replace(
            new RegExp(regexpQuote(item.instance.attrs.name), 'i'),
            newName
          ).replace(/hellorunnable/gi, $scope.data.activeAccount.oauthName())
            .replace(/https?:\/\//, '');
        });
      }
      function generateDependenciesNames() {
        $scope.state.dependencies.forEach(function (item) {
          if (item.opts) {
            generateDependencyName(item);
          }
        });
      }

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
          version.appCodeVersions.create({
            repo: repo.attrs.full_name,
            branch: branch.attrs.name,
            commit: branch.attrs.commit.sha
          }, function (err) {
            cb(err);
          });
        };
      }

      function forkInstances(items) {
        //$rootScope.dataApp.data.loading = true;
        function fork(instance, opts, cb) {
          copySourceInstance(
            $scope.data.activeAccount,
            instance,
            opts,
            $scope.data.instances,
            cb
          );
        }

        return function (cb) {
          if (!items.length) { return cb(); }
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