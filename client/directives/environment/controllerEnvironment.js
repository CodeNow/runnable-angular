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
  $state,
  $filter,
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
  copySourceInstance,
  $rootScope
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



  $scope.actions = {
    getFlattenedSelectedStacks: function (selectedStack) {
      if (!selectedStack) {
        return 'none';
      }
      if (selectedStack) {
        var flattened = selectedStack.name + ' v' + selectedStack.selectedVersion;
        if (selectedStack.dependencies) {
          selectedStack.dependencies.forEach(function (dep) {
            flattened += ', ' + $scope.actions.getFlattenedSelectedStacks(dep);
          });
        }
        return flattened;
      } else {
        return 'None';
      }
    },
    addNewServer: function (newServerModel) {
      $scope.data.newServers.push(newServerModel);
      // Do a copy so other servers with the same stack won't share the object
      newServerModel.selectedStack = angular.copy(newServerModel.selectedStack);
      if (newServerModel.selectedStack.ports) {
        newServerModel.ports = newServerModel.selectedStack.ports.replace(/ /g, '').split(',');
      }
      newServerModel.repo.isAdded = true;
      // Close the modal first
      $scope.$emit('close-modal');
      return $scope.actions.createAndBuild(newServerModel);
    },
    saveChangesToServer: function (serverState) {
      var changes = serverState.getChanges();
      var server = serverState.updateCurrentModel();
      $scope.$emit('close-modal');
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
            $rootScope.dataApp.data.activeAccount,
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
      $scope.$emit('close-modal');

      var newServer = {
        building: true,
        instance: {
          attrs: {
            name: instance.attrs.name
          }
        }
      };
      $scope.data.newServers.push(newServer);

      copySourceInstance($rootScope.dataApp.data.activeAccount, instance, {name: instance.attrs.name}).then(function (copiedInstance) {
        createServerObjectFromInstance(copiedInstance, newServer);
        newServer.building = false;
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

  function createServerObjectFromInstance(instance, serverObj) {
    if (!serverObj) {
      serverObj = {};
    }
    var commands = keypather.get(instance, 'containers.models[0].attrs.inspect.Config.Cmd') || [];
    if (commands.length && commands[0] === '/bin/sh') {
      // we need to remove the /bin/sh and -c, since it's going to get added again
      commands.splice(0, 2);
    }
    serverObj.instance = instance;
    serverObj.build = instance.build;
    serverObj.startCommand = commands.join(' ');
    serverObj.selectedStack = 'Need to input';
    serverObj.ports = $filter('filterCleanPorts')(keypather.get(instance, 'containers.models[0].attrs.ports'));
    serverObj.opts = {
      env: instance.attrs.env
    };
    return serverObj;
  }


  $scope.data.loadingNewServers = true;
  if ($state.params.userName) {
    fetchInstances({
      githubUsername: $state.params.userName
    })
      .then(function (instances) {
        $scope.data.newServers = instances.models.map(function (instance) {
          return createServerObjectFromInstance(instance);
        });
        $scope.data.loadingNewServers = false;
      });
  }

  fetchStackInfo()
    .then(function (stacks) {
      keypather.set($scope, 'data.stacks', stacks);
    })
    .catch(errs.handler);

  fetchInstances({ githubUsername: 'HelloRunnable' })
    .then(function (deps) {
      keypather.set($scope, 'data.allDependencies', deps);
    })
    .catch(errs.handler);

  fetchContexts({
    isSource: true
  })
    .then(function (sourceContexts) {
      $scope.data.sourceContexts = sourceContexts;
    });

  $scope.$on('$destroy', function () {
  });

}
