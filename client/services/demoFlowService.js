'use strict';

require('app')
  .factory('demoFlowService', demoFlowService);

function demoFlowService(
  $localStorage,
  $q,
  currentOrg,
  github,
  keypather,
  patchOrgMetadata
) {
  function resetFlags () {
    $localStorage.hasSeenHangTightMessage = false;
    $localStorage.isUsingDemoRepo = false;
    $localStorage.hasSeenUrlCallout = false;
  }

  function setItem (key, value) {
    $localStorage[key] = value;
  }

  function getItem (key) {
    return $localStorage[key];
  }

  function isInDemoFlow () {
    return keypather.get(currentOrg, 'poppa.attrs.metadata.hasAha') &&
      !keypather.get(currentOrg, 'poppa.attrs.metadata.hasCompletedDemo');
  }

  function endDemoFlow() {
    return $q.when()
      .then(function () {
        if (isInDemoFlow()) {
          return patchOrgMetadata(currentOrg.poppa.id(), {
            metadata: {
              hasAha: false,
              hasCompletedDemo: true,
              hasConfirmedSetup: true
            }
          })
            .then(function (updatedOrg) {
              currentOrg.poppa.attrs.metadata = updatedOrg.metadata;
            });
        }
      });
  }

  function createDemoPR (instance) {
    var repoOwner = keypather.get(instance, 'attrs.owner.username');
    var repoName = instance.getRepoName();
    var branchName = instance.getBranchName();
    var sha = keypather.get(instance, 'contextVersion.appCodeVersions.models[0].attrs.commit');
    return createCommitAndSubmitPR(repoOwner, repoName, branchName, sha);
  }

  function hasSeenHangTightMessage () {
    return $localStorage.hasSeenHangTightMessage;
  }

  function submitPR (repoOwner, repoName, branchName) {
    return github.createPR(repoOwner, repoName, 'master', branchName);
  }

  function createCommitAndSubmitPR (repoOwner, repoName, branchName, sha) {
    return github.getTreeForCommit(repoOwner, repoName, sha)
      .then(function (res) {
        var treeSha = res.tree.sha;
        return github.createNewTreeFromSha(repoOwner, repoName, treeSha);
      })
      .then(function (res) {
        var newTreeSha = res.sha;
        return github.createCommit(repoOwner, repoName, sha, newTreeSha);
      })
      .then(function (res) {
        var newCommitSha = res.sha;
        return github.updateRef(repoOwner, repoName, branchName, newCommitSha);
      })
      .then(function (res) {
        return submitPR(repoOwner, repoName, branchName);
      });
  }

  function hasSeenUrlCallout () {
    return $localStorage.hasSeenUrlCallout;
  }

  function setIsUsingDemoRepo (value) {
    $localStorage.isUsingDemoRepo = value;
  }
  function hasAddedBranch (value) {
    if (value !== undefined) {
      $localStorage.hasAddedBranch = value;
    }
    return $localStorage.hasAddedBranch;
  }

  function isUsingDemoRepo () {
    return $localStorage.isUsingDemoRepo;
  }

  return {
    createDemoPR: createDemoPR,
    endDemoFlow: endDemoFlow,
    getItem: getItem,
    hasAddedBranch: hasAddedBranch,
    hasSeenHangTightMessage: hasSeenHangTightMessage,
    hasSeenUrlCallout: hasSeenUrlCallout,
    isInDemoFlow: isInDemoFlow,
    isUsingDemoRepo: isUsingDemoRepo,
    resetFlags: resetFlags,
    setIsUsingDemoRepo: setIsUsingDemoRepo,
    setItem: setItem
  };

}
