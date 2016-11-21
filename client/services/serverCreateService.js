'use strict';

require('app')
  .factory('serverCreateService', serverCreateService);

function serverCreateService (
  cardInfoTypes,
  createAndBuildNewContainer,
  createDockerfileFromSource,
  fetchDockerfileFromSource,
  keypather,
  parseDockerfileForDefaults,
  updateDockerfileFromState
) {

  return function (repoBuildAndBranch, options) {
    var state = {
      acv: repoBuildAndBranch.build.contextVersion.getMainAppCodeVersion(),
      branch: repoBuildAndBranch.masterBranch,
      build: repoBuildAndBranch.build,
      contextVersion: repoBuildAndBranch.build.contextVersion,
      instanceName: repoBuildAndBranch.instanceName,
      packages: new cardInfoTypes.Packages(),
      ports: options.ports,
      stackName: repoBuildAndBranch.defaults.selectedStack.key,
      startCommand: repoBuildAndBranch.defaults.startCommand,
      selectedStack: repoBuildAndBranch.defaults.selectedStack
    };

    state.opts = Object.assign({
      masterPod: true,
      name: state.instanceName,
      env: [],
      ipWhitelist: {
        enabled: false
      },
      isTesting: false
    }, options);
    function defaultSelectedStackVersion (stack) {
      if (!stack.selectedVersion) {
        stack.selectedVersion = stack.suggestedVersion;
      }
    }
    defaultSelectedStackVersion(state.selectedStack);
    if (state.selectedStack.dependencies) {
      state.selectedStack.dependencies.forEach(defaultSelectedStackVersion);
    }

    return createDockerfileFromSource(state.contextVersion, state.stackName)
      .then(function (dockerfile) {
        state.dockerfile = dockerfile;
        return fetchDockerfileFromSource(state.stackName);
      })
      .then(function (sourceDockerfile) {
        var mainRepoContainerFile = new cardInfoTypes.MainRepository();
        var defaults = parseDockerfileForDefaults(sourceDockerfile, ['run', 'dst']);
        mainRepoContainerFile.commands = defaults.run.map(function (run) {
          return new cardInfoTypes.Command('RUN ' + run);
        });
        mainRepoContainerFile.name = state.instanceName;
        mainRepoContainerFile.path = state.instanceName;
        state.containerFiles = [mainRepoContainerFile];
        return updateDockerfileFromState(state, false, true);
      })
      .then(function () {
        return createAndBuildNewContainer(state, state.instanceName);
      });
  };
}
