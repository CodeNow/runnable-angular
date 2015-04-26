'use strict';

require('app')
  .controller('ControllerEnvironment', ControllerEnvironment);
/**
 * ControllerEnvironment
 * @constructor
 * @export
 * @ngInject
 */
function ControllerEnvironment(
  $scope,
  $state,
  $filter,
  createDockerfileFromSource,
  createNewInstance,
  errs,
  eventTracking,
  favico,
  fetchContexts,
  fetchDockerfileFromSource,
  populateDockerfile,
  fetchStackInfo,
  getInstanceClasses,
  keypather,
  fetchInstances,
  promisify,
  updateInstanceWithNewBuild,
  copySourceInstance,
  $rootScope,
  parseDockerfileForStackFromInstance
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
    deleteServer: function (server) {
      $scope.$broadcast('close-popovers');
      if (confirm('Are you sure you want to delete this server?')) {
        var index = $scope.data.newServers.indexOf(server);
        promisify(server.instance, 'destroy')()
          .then(function () {
            $scope.data.newServers.splice(index, 1);
          })
          .catch(errs.handler);
      }
    },
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
      }
      return 'None';
    },
    addNewServer: function (newServerModel) {
      $scope.data.newServers.push(newServerModel);
      // Do a copy so other servers with the same stack won't share the object
      newServerModel.selectedStack = angular.copy(newServerModel.selectedStack);
      if (newServerModel.selectedStack.ports) {
        newServerModel.ports = newServerModel.selectedStack.ports.replace(/ /g, '').split(',');
      }
      // Close the modal first
      $scope.$emit('close-modal');
      return $scope.actions.createAndBuild(newServerModel);
    },
    saveChangesToServer: function (serverState) {
      var changes = serverState.getChanges();
      var server = serverState.updateCurrentModel();
      $scope.$emit('close-modal');
      var promiseChain = null;
      server.building = true;
      if (changes.dockerfile) {
        // We need to copy the build, so do that
        promiseChain = promisify(server.contextVersion, 'fetchFile')('/Dockerfile')
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
            return updateInstanceWithNewBuild(
              server.instance,
              server.build,
              {
                message: 'manual'
              },
              changes.opts
            );
          });
      }
      if (keypather.get(changes.opts, 'env.length')) {
        promiseChain = promisify(server.instance, 'update')(changes.opts)
          .then(function () {
            if (keypather.get(server.instance, 'container.running()')) {
              return promisify(server.instance, 'redeploy')();
            }
          });
      }
      promiseChain
        .catch(errs.handler)
        .finally(function () {
          server.building = false;
        });
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
        })
        .catch(function (err) {
          errs.handler(err);
          // Remove it from the servers list
          $scope.data.newServers.splice(
            $scope.data.newServers.indexOf(newServerModel),
            1
          );
        })
        .finally(function () {
          newServerModel.building = false;
        });
    },
    addServerFromTemplate: function (instance) {
      $scope.$emit('close-modal');

      var serverName = getUniqueServerName(instance.attrs.name);

      var newServer = {
        building: true,
        instance: {
          attrs: {
            name: serverName
          }
        }
      };
      $scope.data.newServers.push(newServer);

      copySourceInstance(
        $rootScope.dataApp.data.activeAccount,
        instance,
        {
          name: serverName,
          masterPod: true
        }
      )
        .then(function (copiedInstance) {
          createServerObjectFromInstance(copiedInstance, newServer);
          newServer.building = false;
        });
    }
  };

  function getUniqueServerName(serverName) {
    function getServerByName(serverName){
      return $scope.data.newServers.find(function (server) {
        return server.instance.attrs.name === serverName;
      });
    }
    var counter = 1;
    var tempServerName = serverName;
    while (getServerByName(tempServerName)) {
      counter += 1;
      tempServerName = serverName + '-' + counter;
    }
    return tempServerName;
  }

  $scope.getInstanceClasses = getInstanceClasses;

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
    serverObj.contextVersion = instance.contextVersion;
    serverObj.build = instance.build;
    serverObj.startCommand = commands.join(' ');
    serverObj.ports = $filter('filterCleanPorts')(keypather.get(instance, 'containers.models[0].attrs.ports'));
    serverObj.opts = {
      env: instance.attrs.env
    };
    parseDockerfileForStackFromInstance(instance, $scope.data.stacks)
      .then(function (stackObject) {
        serverObj.selectedStack = stackObject;
      });


    serverObj.repo = keypather.get(instance.contextVersion, 'appCodeVersions.models[0].githubRepo');
    if (serverObj.repo) {
      promisify(serverObj.repo.branches, 'fetch')();
    }
    return serverObj;
  }

  $scope.data.loadingNewServers = true;
  if ($state.params.userName) {
    fetchInstances({
      githubUsername: $state.params.userName
    })
      .then(function (instances) {
        $scope.data.newServers = instances.models
          //.filter(function (instance) {
          //  return instance.attrs.masterPod;
          //})
          .map(function (instance) {
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
}
