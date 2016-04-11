'use strict';

require('app')
  .controller('ChooseDockerfileModalController', ChooseDockerfileModalController);

function ChooseDockerfileModalController(
  $timeout,
  errs,
  fetchRepoDockerfiles,
  loading,
  close,
  repo
) {
  var CDMC = this;
  angular.extend(CDMC, {
    state: {
      repo: repo
    }
  });
  loading.reset(CDMC.name);

  loading(CDMC.name, true);
  fetchRepoDockerfiles(repo)
    .then(function (dockerfiles) {
      CDMC.state.repo.dockerfiles = dockerfiles;
    })
    .catch(errs.handler)
    .finally(function () {
      loading(CDMC.name, false);
    });

  CDMC.cancel = close.bind(null, false);

  CDMC.confirm = function (dockerfile) {
    if (dockerfile) {
      return close(dockerfile);
    }
    throw new Error('Dockerfile path needed');
  };
}

