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
    var buildDefaults = repoBuildAndBranch.defaults;
    var state = {
      acv: repoBuildAndBranch.build.contextVersion.getMainAppCodeVersion(),
      branch: repoBuildAndBranch.masterBranch,
      build: repoBuildAndBranch.build,
      contextVersion: repoBuildAndBranch.build.contextVersion,
      instanceName: repoBuildAndBranch.instanceName,
      packages: new cardInfoTypes.Packages(),
      ports: options.ports,
      stackName: buildDefaults.selectedStack.key,
      startCommand: buildDefaults.startCommand,
      selectedStack: buildDefaults.selectedStack
    };

    state.opts = Object.assign({
      masterPod: true,
      name: state.instanceName,
      env: [],
      ipWhitelist: {
        enabled: false
      },
      isTesting: false,
      shouldNotAutofork: false
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
    if (buildDefaults.packages) {
      if (Array.isArray(buildDefaults.packages)) {
        buildDefaults.packages = buildDefaults.packages.join(' ');
      }
      state.packages.packageList = buildDefaults.packages;
    }

    return createDockerfileFromSource(state.contextVersion, state.stackName)
      .then(function (dockerfile) {
        state.dockerfile = dockerfile;
        return fetchDockerfileFromSource(state.stackName);
      })
      .then(function (sourceDockerfile) {
        var mainRepoContainerFile = new cardInfoTypes.MainRepository();
        var defaults = parseDockerfileForDefaults(sourceDockerfile, ['run', 'dst']);
        mainRepoContainerFile.commands = buildDefaults.run.map(function (run) {
          return new cardInfoTypes.Command('RUN ' + run);
        });
        mainRepoContainerFile.name = state.instanceName;
        mainRepoContainerFile.path = keypather.get(defaults, 'dst[0]') || state.instanceName;

        // this removes any / at the front of the path, since the populater already does it
        if (/^\/?\//.test(mainRepoContainerFile.path)) {
          mainRepoContainerFile.path = mainRepoContainerFile.path.replace(/^\/?\//, '');
        }

        state.containerFiles = [mainRepoContainerFile];
        return updateDockerfileFromState(state, false, true);
      })
      .then(function () {
        return createAndBuildNewContainer(state, state.instanceName);
      });
  };
}
