'use strict';

require('app')
  .controller('ChooseDockerfileModalController', ChooseDockerfileModalController);

function ChooseDockerfileModalController(
  $timeout,
  errs,
  fetchRepoDockerfiles,
  keypather,
  loading,
  close,
  repo,
  repoFullName
) {
  var CDMC = this;
  angular.extend(CDMC, {
    state: {
      repo: repo
    }
  });
  loading.reset(CDMC.name);

  loading(CDMC.name, true);
  fetchRepoDockerfiles(keypather.get(repo, 'attrs.full_name') || repoFullName)
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

