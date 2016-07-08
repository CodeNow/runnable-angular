'use strict';

require('app')
  .controller('MirrorDockerfileController', MirrorDockerfileController);

function MirrorDockerfileController(
  $rootScope,
  doesDockerfileExist,
  errs,
  fetchRepoDockerfile,
  fetchRepoDockerfiles,
  keypather,
  loading,
  ModalService
) {
  var MDC = this;
  if (!MDC.repo) {
    throw new Error('A repo is required for this controller');
  }
  MDC.newDockerfilePaths = ['Dockerfile'];
  var oauthName = keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()');
  var name = keypather.get(MDC.repo, 'attrs.name');
  var fullname = keypather.get(MDC.repo, 'attrs.full_name') || (oauthName + '/' + name);
  var branch = MDC.branchName || keypather.get(MDC.repo, 'attrs.default_branch');

  MDC.fetchRepoDockerfiles = function () {
    loading('mirrorDockerfile', true);
    return fetchRepoDockerfiles(fullname, branch, MDC.newDockerfilePaths)
      .then(function (dockerfiles) {
        MDC.newDockerfilePaths = dockerfiles.map(function (dockerfile) {
          return dockerfile.path;
        });
        MDC.state.repo.dockerfiles = dockerfiles;
      })
      .catch(errs.handler)
      .finally(function () {
        loading('mirrorDockerfile', false);
      });
  };

  MDC.addDockerfile = function () {
    ModalService.showModal({
      controller: 'SingleValueModalController',
      controllerAs: 'MC',
      templateUrl: 'addDockerfileView'
    })
      .then(function (modal) {
        return modal.close;
      })
      .then(function (newDockerfilePath) {
        if (newDockerfilePath) {
          loading('mirrorDockerfile', true);
          return fetchRepoDockerfile(fullname, branch, newDockerfilePath)
            .then(doesDockerfileExist)
            .then(function (file) {
              MDC.newDockerfilePaths.push(file.path);
            })
            .then(MDC.fetchRepoDockerfiles)
            .catch(errs.handler)
            .finally(function () {
              loading('mirrorDockerfile', false);
            });
        }
      });
  };
}

