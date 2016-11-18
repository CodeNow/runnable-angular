'use strict';

require('app')
  .factory('demoFlowService', demoFlowService);

function demoFlowService (
  $q,
  $timeout,
  createNewBuildAndFetchBranch,
  currentOrg,
  errs,
  fetchInstancesByPod,
  fetchOwnerRepos,
  fetchStackInfo,
  github,
  keypather,
  loading,
  serverCreateService
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
        return serverCreateService(repoBuildAndBranch);
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
}
