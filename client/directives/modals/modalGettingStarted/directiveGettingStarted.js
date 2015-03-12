'use strict';

require('app')
  .directive('modalGettingStarted', modalGettingStarted);
/**
 * directive modalGettingStarted
 * @ngInject
 */
function modalGettingStarted(
  $rootScope,
  $timeout,
  createDockerfileFromSource,
  copySourceInstance,
  errs,
  getNewForkName,
  regexpQuote,
  gsPopulateDockerfile,
  $q,
  promisify,
  createNewInstance,
  $state,
  fetchStackInfo,
  fetchInstances,
  keypather,
  createNewBuild,
  createInstanceUrl,
  configUserContentDomain
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
          var url = (keypather.get(
            instance,
            'containers.models[0].urls(%)[0]',
            configUserContentDomain
          ) || createInstanceUrl(instance)).toLowerCase();
          url = url.replace(/https?:\/\//, '')
            .replace(/:\d{0,5}/g, '');

          if (!fromExisting) {
            url = url.replace(/hellorunnable/gi, $scope.data.activeAccount.oauthName());
          }
          var envName = instance.attrs.name.replace(/-/gm, '_').toUpperCase();
          var thisEnvName = envName + '_HOST';
          var newItem = {
            instance: instance,
            opts: !fromExisting ? {
              env: instance.attrs.env,
              owner: {
                github: $scope.data.activeAccount.oauthId()
              }
            } : null,
            env: {
              model: thisEnvName + '=' + url,
              originalUrl: url
            },
            otherEnvs: []
          };
          if (!fromExisting) {
            generateDependencyName(newItem);
          }
          $scope.state.dependencies.push(newItem);
        },
        addEnv: function (item) {
          item.otherEnvs.push({ model: '' });
        },
        removeEnv: function (item, env) {
          var index = item.otherEnvs.indexOf(env);
          item.otherEnvs.splice(index, 1);
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
        createAndBuild: function () {
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
              $scope.state.opts.name = getNewForkName({
                attrs: {
                  name: $scope.state.selectedRepo.attrs.name.replace(/\W/gim, '_')
                }
              }, $scope.data.instances, true);
              createAppCodeVersions(
                $scope.state.contextVersion,
                $scope.state.selectedRepo,
                $scope.state.activeBranch
              ).then(function () {
                return gsPopulateDockerfile(
                  $scope.state.dockerfile,
                  $scope.state
                );
              }).then(function () {
                return forkInstances($scope.state.dependencies);
              }).then(function () {
                return createNewInstance(
                  $scope.data.activeAccount,
                  $scope.state.build,
                  $scope.state.opts
                );
              }).then(function () {
                $rootScope.dataApp.data.loading = false;
                var newStateParams = {
                  userName: $scope.data.activeAccount.oauthName(),
                  instanceName: $scope.state.opts.name
                };
                $scope.defaultActions.close();
                return newStateParams;
              }).then(function (newStateParams) {
                $timeout(function () {
                  $state.go('instance.instance', newStateParams);
                }, 10);
              }).catch(function (err) {
                $scope.building = false;
                errs.handler(err);
                resetModalData(
                  $scope.data.activeAccount
                ).then(function () {
                  return createDockerfileFromSource(
                    $scope.state.contextVersion,
                    $scope.state.stack.key
                  );
                }).then(function (dockerfile) {
                  $scope.state.dockerfile = dockerfile;
                }).catch(
                  errs.handler
                ).finally(function () {
                  $rootScope.dataApp.data.loading = false;
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
        furthestStep: 1,
        unableToBuild: false
      };
      keypather.set($scope, 'data.accountsDisabled', function () {
        return $scope.state.step > 1;
      });
      fetchInstances({
        githubUsername: 'HelloRunnable'
      }).then(function (deps) {
        keypather.set($scope, 'data.allDependencies', deps);
      }).catch(errs.handler);

      fetchStackInfo().then(function (stacks) {
        keypather.set($scope, 'data.stacks', stacks);
      }).catch(errs.handler);

      $scope.$watch('state.stack', function (n) {
        if (n) {
          var unwatchCv = $scope.$watch('state.contextVersion', function (contextVersion) {
            if (contextVersion) {
              unwatchCv();
              createDockerfileFromSource(
                contextVersion,
                n.key
              ).then(function (dockerfile) {
                $scope.state.dockerfile = dockerfile;
              }).catch(errs.handler);
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

      function resetModalData(user) {
        $scope.state.build = null;
        $scope.state.contextVersion = null;
        $scope.state.dockerfile = null;
        $scope.data.instances = null;
        return createNewBuild(user).then(function (buildWithVersion) {
          $scope.state.build = buildWithVersion;
          $scope.state.contextVersion = buildWithVersion.contextVersion;
        }).then(function () {
          return fetchInstances({
            githubUsername: user.oauthName()
          });
        }).then(function (instances) {
          $scope.data.instances = instances;
        }).catch(function(e){
          $scope.state.unableToBuild = true;
        });
      }

      function generateDependencyName(item) {
        if (!item.opts) { return; } // No opts means we're just referencing, not forking.
        var newName = getNewForkName(item.instance, $scope.data.instances, true);
        // oldUrl will be the one we're looking for in the env
        var oldUrl = ((item.opts.name) ? item.env.originalUrl.replace(
          new RegExp(regexpQuote(item.instance.attrs.name), 'i'),
          item.opts.name
        ) : item.env.originalUrl).toLowerCase();
        var newUrl = item.env.originalUrl.replace(
          new RegExp(regexpQuote(item.instance.attrs.name), 'i'),
          newName
        ).toLowerCase();
        item.opts.name = newName;
        item.env.model = item.env.model.replace(
          new RegExp(regexpQuote(oldUrl), 'i'),
          newUrl
        );
        item.env.newUrl = newUrl;
        item.env.placeholder = item.env.model;
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
          envList.push(item.env.model);
          if (item.otherEnvs.length) {
            item.otherEnvs.forEach(function (env) {
              if (env.length) { envList.push(env); }
            });
          }
        });
        if ($scope.state.extraEnvs) {
          $scope.state.extraEnvs.split('\n').forEach(function (env) {
            if (env.length) { envList.push(env); }
          });
        }
        return envList;
      }

      function createAppCodeVersions(version, repo, branch) {
        var skipEarlyReturn = true;
        return promisify(version.appCodeVersions, 'create', skipEarlyReturn)({
          repo: repo.attrs.full_name,
          branch: branch.attrs.name,
          commit: branch.attrs.commit.sha
        });
      }

      function forkInstances(items) {
        if (!items.length) { return; }
        var parallelFunctions = items.filter(function (item) {
          return item.opts;
        }).map(function (item) {
          return copySourceInstance(
            $scope.data.activeAccount,
            item.instance,
            item.opts
          );
        });
        return $q.all(parallelFunctions);
      }
    }
  };
}
