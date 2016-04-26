'use strict';

require('app')
  .controller('ChooseDockerfileModalController', ChooseDockerfileModalController);

function ChooseDockerfileModalController(
  $rootScope,
  errs,
  fetchRepoDockerfiles,
  keypather,
  loading,
  close,
  repo,
  branchName
) {
  var CDMC = this;
  if (!repo) {
    throw new Error('A repo is required for this controller');
  }
  angular.extend(CDMC, {
    name: 'ChooseDockerfileModal',
    state: {
      repo: repo
    }
  });
  loading.reset(CDMC.name);

  loading(CDMC.name, true);
  var oauthName = keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()');
  var name = keypather.get(repo, 'attrs.name');
  var fullname = keypather.get(repo, 'attrs.full_name') || (oauthName + '/' + name);
  var defaultBranch = keypather.get(repo, 'attrs.default_branch');
  fetchRepoDockerfiles(fullname, branchName || defaultBranch)
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

