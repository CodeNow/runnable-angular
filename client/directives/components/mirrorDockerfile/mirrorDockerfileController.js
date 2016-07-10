'use strict';

require('app')
  .controller('MirrorDockerfileController', MirrorDockerfileController);

function MirrorDockerfileController(
  $rootScope,
  $timeout,
  errs,
  fetchRepoDockerfiles,
  keypather,
  ModalService
) {
  var MDC = this;
  if (!MDC.repo) {
    throw new Error('A repo is required for this controller');
  }

  MDC.resetDockerfilePaths = function () {
    MDC.newDockerfilePaths = [];
  };

  var oauthName = keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()');
  var name = keypather.get(MDC.repo, 'attrs.name');
  var fullname = keypather.get(MDC.repo, 'attrs.full_name') || (oauthName + '/' + name);
  var branch = MDC.branchName || keypather.get(MDC.repo, 'attrs.default_branch');

  MDC.fetchRepoDockerfiles = function () {
    return fetchRepoDockerfiles(fullname, branch, MDC.newDockerfilePaths)
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

  MDC.addDockerfileFromPath = function (newDockerfilePath) {
    if (newDockerfilePath) {
      // This replace will make sure every path being added starts with /
      newDockerfilePath = newDockerfilePath.replace(/^\/*/, '/');
      if (!MDC.newDockerfilePaths.includes(newDockerfilePath)) {
        MDC.newDockerfilePaths.push(newDockerfilePath);
      }
      return MDC.fetchRepoDockerfiles()
        .then(function (dockerfiles) {
          // I'm sorry this is here, because it's terrible.  This is so the panel length will update
          // and fix it's height.  I'm pretty sure it's some issue with animated-panel
          return $timeout(angular.noop)
            .then(function () {
              return dockerfiles;
            });
        })
        .then(function (dockerfiles) {
          MDC.state.dockerfile = dockerfiles.find(function (dockerfile) {
            return dockerfile.path === newDockerfilePath;
          });
        });
    }
  };

  MDC.addDockerfileModal = function () {
    return ModalService.showModal({
      controller: 'AddDockerfileModalController',
      controllerAs: 'MC',
      templateUrl: 'addDockerfileModal',
      inputs: {
        branchName: branch,
        fullRepo: fullname
      }
    })
      .then(function (modal) {
        return modal.close;
      })
      .then(MDC.addDockerfileFromPath);
  };
}

