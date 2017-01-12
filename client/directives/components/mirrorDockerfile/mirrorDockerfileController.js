'use strict';

require('app')
  .controller('MirrorDockerfileController', MirrorDockerfileController);

function MirrorDockerfileController(
  $q,
  $rootScope,
  $timeout,
  errs,
  fetchRepoDockerfiles,
  keypather
) {
  var MDC = this;
  if (!MDC.repo) {
    throw new Error('A repo is required for this controller');
  }

  MDC.resetDockerfilePaths = function () {
    MDC.newDockerfilePaths = [];
  };

  MDC.resetDockerComposeFilePaths = function () {
    MDC.newDockerComposeFilePaths = [];
  };

  var oauthName = keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()');
  var name = keypather.get(MDC.repo, 'attrs.name');
  MDC.getFullRepo = function() {
    return keypather.get(MDC.repo, 'attrs.full_name') || (oauthName + '/' + name);
  };
  MDC.branchName = MDC.branchName || keypather.get(MDC.repo, 'attrs.default_branch');
  MDC.state.configurationMethod = null;

  MDC.fetchRepoDockerfiles = function () {
    return fetchRepoDockerfiles(MDC.getFullRepo(), MDC.branchName, MDC.newDockerfilePaths)
      .then(function (dockerfiles) {
        // remove any dead paths by replacing them with the results
        MDC.newDockerfilePaths = dockerfiles.map(function (dockerfile) {
          return dockerfile.path;
        });
        MDC.repo.dockerfiles = dockerfiles;
        return dockerfiles;
      })
      .catch(errs.handler);
  };

  MDC.fetchRepoDockerComposeFiles = function () {
    return fetchRepoDockerfiles(MDC.getFullRepo(), MDC.branchName, MDC.newDockerComposeFilePaths)
      .then(function (dockerfiles) {
        // remove any dead paths by replacing them with the results
        MDC.newDockerComposeFilePaths = dockerfiles.map(function (dockerfile) {
          return dockerfile.path;
        });
        MDC.repo.dockerComposeFiles = dockerfiles;
        return dockerfiles;
      })
      .catch(errs.handler);
  };

  MDC.addDockerfileFromPath = function (newDockerfilePath) {
    if (newDockerfilePath) {
      // This replace will make sure every path being added starts with /
      newDockerfilePath = newDockerfilePath.replace(/^\/*/, '/');
      if (!MDC.newDockerfilePaths.includes(newDockerfilePath)) {
        MDC.newDockerfilePaths.push(newDockerfilePath);
      }
      return MDC.fetchRepoDockerfiles()
        .then(function (dockerfiles) {
          MDC.state.dockerfile = dockerfiles.find(function (dockerfile) {
            return dockerfile.path === newDockerfilePath;
          });
        });
    }
    // If given no input, return promise
    return $q.when(true);
  };

  MDC.addDockerComposeFileFromPath = function (newDockerComposeFilePath) {
    if (newDockerComposeFilePath) {
      // This replace will make sure every path being added starts with /
      newDockerComposeFilePath = newDockerComposeFilePath.replace(/^\/*/, '/');
      if (!MDC.newDockerComposeFilePaths.includes(newDockerComposeFilePath)) {
        MDC.newDockerComposeFilePaths.push(newDockerComposeFilePath);
      }
      return MDC.fetchRepoDockerComposeFiles()
        .then(function (dockerComposeFiles) {
          MDC.state.dockerComposeFile = dockerComposeFiles.find(function (dockerfile) {
            return dockerfile.path === newDockerComposeFilePath;
          });
        });
    }
    // If given no input, return promise
    return $q.when(true);
  };
}

