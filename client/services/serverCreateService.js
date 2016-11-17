'use strict';

require('app')
  .factory('serverCreateService', serverCreateService) // this is the demo flow prep
  .factory('serviceCreateServiceReal', serviceCreateServiceReal);

function serverCreateService (
  $q,
  $timeout,
  cardInfoTypes,
  createAndBuildNewContainer,
  createDockerfileFromSource,
  createNewBuildAndFetchBranch,
  currentOrg,
  errs,
  fetchDockerfileFromSource,
  fetchInstancesByPod,
  fetchOwnerRepos,
  fetchStackInfo,
  github,
  keypather,
  loading,
  parseDockerfileForDefaults,
  updateDockerfileFromState
) {
  
  var repoMapping = {
    nodejs: 'node-starter',
    python: 'python-starter',
    ruby: 'ruby-starter'
  };

  return function (stackName) {
    loading('startDemo', true);
    var loadingName = 'startDemo' + stackName.charAt(0).toUpperCase() + stackName.slice(1);
    loading(loadingName, true);
    var isPersonalAccount = keypather.get(currentOrg, 'poppa.attrs.isPersonalAccount');
    var mainRepoContainerFile = {};
    var state = {};
    return github.forkRepo('RunnableDemo', repoMapping[stackName], currentOrg.github.oauthName(), isPersonalAccount)
      .then(function () {
        return findRepo(repoMapping[stackName]);
      })
      .then(function (repoModel) {
        return $q.all({
          repoBuildAndBranch: createNewBuildAndFetchBranch(currentOrg.github, repoModel, '', false),
          stacks: fetchStackInfo(),
          instances: fetchInstancesByPod()
        });
      })
      .then(function (promiseResults) {
        var repoBuildAndBranch = promiseResults.repoBuildAndBranch;
        repoBuildAndBranch.instanceName = getUniqueInstanceName(repoMapping[stackName], promiseResults.instances);
        var selectedStack = promiseResults.stacks.find(function (stack) {
          return stack.key === stackName;
        });
        selectedStack.selectedVersion = selectedStack.suggestedVersion;
        repoBuildAndBranch.defaults = {
          selectedStack: selectedStack,
          startCommand: selectedStack.startCommand[0],
          keepStartCmd: true,
          step: 3
        };
        return repoBuildAndBranch;
      })
      .then(function (repoBuildAndBranch) {
        state.acv = repoBuildAndBranch.build.contextVersion.getMainAppCodeVersion();
        state.branch = repoBuildAndBranch.masterBranch;
        state.build = repoBuildAndBranch.build;
        state.contextVersion = repoBuildAndBranch.build.contextVersion;
        state.branch = repoBuildAndBranch.repo;
        state.instanceName = repoBuildAndBranch.instanceName;
        state.opts = {
          masterPod: true,
          name: state.instanceName,
          env: [],
          ipWhitelist: {
            enabled: false
          },
          isTesting: false
        };
        state.packages = new cardInfoTypes.Packages();
        state.stackName = repoBuildAndBranch.defaults.selectedStack.key;
        state.startCommand = repoBuildAndBranch.defaults.startCommand;
        state.selectedStack = repoBuildAndBranch.defaults.selectedStack;
        return createDockerfileFromSource(state.contextVersion, state.stackName)
      })
      .then(function (dockerfile) {
        state.dockerfile = dockerfile;
        return fetchDockerfileFromSource(state.stackName)
          .then(function (sourceDockerfile) {
            var mainRepoContainerFile = new cardInfoTypes.MainRepository();
            var defaults = parseDockerfileForDefaults(sourceDockerfile, ['run', 'dst']);
            mainRepoContainerFile.commands = defaults.run.map(function (run) {
              return new cardInfoTypes.Command('RUN ' + run);
            });
            mainRepoContainerFile.name = state.instanceName;
            mainRepoContainerFile.path = state.instanceName;
            state.containerFiles = [mainRepoContainerFile];
          })
          .then(function () {
            return loadAllOptions(state);
          })
          .then(function () {
            return updateDockerfileFromState(state, false, true);
          })
          .then(function () {
            return createAndBuildNewContainer(state, state.instanceName);
          })
      })
      .catch(errs.handler)
      .finally(function () {
        loading('startDemo', false);
        loading(loadingName, false);
      });
  };


  function findRepo (repoName, count) {
    count = count || 0;
    if (count > 30) {
      return $q.reject('We were unable to find the repo we just forked. Please try again!');
    }
    return fetchOwnerRepos(currentOrg.github.oauthName())
      .then(function (repos) {
        var repoModel = repos.models.find(function (repo) {
          return repo.attrs.name === repoName;
        });
        if (repoModel) {
          return repoModel;
        }
        return $timeout(function () {
          return findRepo(repoName, ++count);
        }, 1000);
      });
  }

  function getUniqueInstanceName (name, instances, count) {
    count = count || 0;
    var tmpName = name;
    if (count > 0) {
      tmpName = name + '-' + count;
    }
    var instance = instances.find(function (instance) {
      return instance.attrs.name.toLowerCase() === tmpName.toLowerCase();
    });
    if (instance) {
      return getUniqueInstanceName(name, instances, ++count);
    }
    return tmpName;
  }
  function loadPorts () {
    var portsStr = keypather.get(state, 'selectedStack.ports');
    if (typeof portsStr === 'string') {
      portsStr = portsStr.replace(/,/gi, '');
      var ports = (portsStr || '').split(' ');
      // After initially adding ports here, `ports` can no longer be
      // added/removed since these will be managed by the `ports-form` directive
      // and will get overwritten if a port is added/removed.
      return ports;
    }
    return [];
  }

  function instanceSetHandler (instance) {
    if (instance) {
      SMC.instance = instance;
      SMC.state.instance = instance;
      SMC.state.instance.on('update', SMC.handleInstanceUpdate);
      // Reset the opts, in the same way as `EditServerModalController`
      SMC.state.opts  = {
        env: keypather.get(instance, 'attrs.env') || [],
        ipWhitelist: angular.copy(keypather.get(instance, 'attrs.ipWhitelist')) || {
          enabled: false
        },
        isTesting: keypather.get(instance, 'attrs.isTesting') || false
      };
      return instance;
    }
    return $q.reject(new Error('Instance not created properly'));
  }

  function loadAllOptions(state) {
    var portsStr = keypather.get(state, 'selectedStack.ports');
      if (typeof portsStr === 'string') {
        portsStr = portsStr.replace(/,/gi, '');
        var ports = (portsStr || '').split(' ');
        // After initially adding ports here, `ports` can no longer be
        // added/removed since these will be managed by the `ports-form` directive
        // and will get overwritten if a port is added/removed.
         state.ports = ports;
      }
  }
}

function serviceCreateServiceReal (

  ) {

}
