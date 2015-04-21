'use strict';

require('app')
  .controller('ControllerEnvironment', ControllerEnvironment);
/**
 * ControllerEnvironment
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerEnvironment(
  $scope,
  $log,
  createDockerfileFromSource,
  createNewBuild,
  createNewInstance,
  errs,
  eventTracking,
  favico,
  fetchContexts,
  fetchDockerfileFromSource,
  fetchOwnerRepos,
  populateDockerfile,
  fetchStackAnalysis,
  fetchStackInfo,
  getInstanceClasses,
  keypather,
  fetchInstances,
  pageName,
  JSTagsCollection,
  promisify,
  updateInstanceWithNewBuild,
  copySourceInstance
) {
  favico.reset();
  $scope.data = {
    newServers: []
  };
  $scope.state = {
    validation: {
      env: {}
    }
  };


  fetchInstances({
    githubUsername: 'HelloRunnable'
  }).then(function (deps) {
    keypather.set($scope, 'data.allDependencies', deps);
  }).catch(errs.handler);


  $scope.actions = {
    selectAccount: function (account) {
      $scope.data.activeAccount = account;
      $scope.loading = true;
      $scope.data.githubRepos = null;
      fetchOwnerRepos(account.oauthName())
        .then(function (repoList) {
          $scope.data.githubRepos = repoList;
        })
        .catch(
          errs.handler
        ).finally(function () {
          $scope.loading = false;
        });
    },
    getFlattenedSelectedStacks: function (selectedStack) {
      var flattened = selectedStack.name + ' v' + selectedStack.selectedVersion;
      if (selectedStack.dependencies) {
        selectedStack.dependencies.forEach(function (dep) {
          flattened += ', ' + $scope.actions.getFlattenedSelectedStacks(dep);
        });
      }
      return flattened;
    },
    addNewServer: function (newServerModel, defaultActions) {
      $scope.data.newServers.push(newServerModel);
      // Do a copy so other servers with the same stack won't share the object
      newServerModel.selectedStack = angular.copy(newServerModel.selectedStack);
      if (newServerModel.selectedStack.ports) {
        newServerModel.ports = newServerModel.selectedStack.ports.replace(/ /g, '').split(',');
      }
      newServerModel.repo.isAdded = true;
      // Close the modal first
      defaultActions.close();
      return $scope.actions.createAndBuild(newServerModel);
    },
    saveChangesToServer: function (serverState, defaultActions) {
      var changes = serverState.getChanges();
      var server = serverState.updateCurrentModel();
      defaultActions.close();
      if (changes.dockerfile) {
        // We need to copy the build, so do that
        return promisify(server.build, 'deepCopy')()
          .then(function (build) {
            server.build = build;
            server.contextVersion = build.contextVersions.models[0];
            // we need to edit the dockerfile, so fetch a source one
            return promisify(server.contextVersion, 'fetchFile')('/Dockerfile');
          })
          .then(function (newDockerfile) {
            server.dockerfile = newDockerfile;
            return fetchDockerfileFromSource(
              server.selectedStack.key,
              $scope.data.sourceContexts
            );
          })
          .then(function (sourceDockerfile) {
            return populateDockerfile(
              sourceDockerfile,
              serverState,
              server.dockerfile
            );
          })
          .then(function () {
            return updateInstanceWithNewBuild(server.instance, server.build, false, changes.opts);
          });
      }
      if (keypather.get(changes.opts, 'env.length')) {
        return promisify(server.instance, 'update')(changes.opts)
          .then(function () {
            if (keypather.get(server.instance, 'container.running()')) {
              return promisify(server.instance, 'redeploy')();
            }
          });
      }
    },
    createAndBuild: function (newServerModel) {
      if (newServerModel.building) {
        return;
      }
      newServerModel.building = true;
      eventTracking.triggeredBuild(false);

      return createDockerfileFromSource(
        newServerModel.contextVersion,
        newServerModel.selectedStack.key,
        $scope.data.sourceContexts
      )
        .then(function (dockerfile) {
          newServerModel.dockerfile = dockerfile;
          return populateDockerfile(
            dockerfile,
            newServerModel
          );
        })
        .then(function () {
          return createNewInstance(
            $scope.data.activeAccount,
            newServerModel.build,
            newServerModel.opts
          );
        })
        .then(function (instance) {
          newServerModel.instance = instance;
          newServerModel.building = false;
        })
        .catch(function (err) {
          errs.handler(err);
          newServerModel.building = false;
        });
    },
    addServerFromTemplate: function (instance) {
      copySourceInstance($scope.data.activeAccount, instance, {}).then(function (copiedInstance) {
      });
    }
  };
  $scope.getInstanceStatus = {
    color: function (server) {
      var classes = getInstanceClasses(server.instance);
      return {
        orange: classes.building,
        red: classes.failed,
        green: classes.running
      };
    },
    text: function (server) {
      var classes = getInstanceClasses(server.instance);
      return classes.running ?
          'Build successful' : (classes.building ? 'Building' : 'Building Failed');
    }
  };

  fetchStackInfo().then(function (stacks) {
    keypather.set($scope, 'data.stacks', stacks);
  }).catch(errs.handler);

  fetchContexts({
    isSource: true
  }).then(function (sourceContexts) {
    $scope.data.sourceContexts = sourceContexts;
  });

  $scope.$on('$destroy', function () {
  });

}
