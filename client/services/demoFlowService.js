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

  function hasSeenHangTightMessage () {
    return $localStorage.hasSeenHangTightMessage;
  }

  function submitDemoPR (instance) {
    var repoOwner = keypather.get(instance, 'attrs.owner.username');
    var repoName = instance.getRepoName();
    return github.createPR(repoOwner, repoName, 'master', 'dark-theme');
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

  function isAddingPR () {
    return currentOrg.isPersonalAccount() && isUsingDemoRepo();
  }

  return {
    endDemoFlow: endDemoFlow,
    getItem: getItem,
    hasAddedBranch: hasAddedBranch,
    hasSeenHangTightMessage: hasSeenHangTightMessage,
    hasSeenUrlCallout: hasSeenUrlCallout,
    isAddingPR: isAddingPR,
    isInDemoFlow: isInDemoFlow,
    isUsingDemoRepo: isUsingDemoRepo,
    resetFlags: resetFlags,
    setIsUsingDemoRepo: setIsUsingDemoRepo,
    setItem: setItem,
    submitDemoPR: submitDemoPR
  };
}

 // function createCommitAndSubmitPR (repoOwner, repoName, branchName, sha) {
 //    return github.getTreeForCommit(repoOwner, repoName, sha)
 //      .then(function (res) {
 //        var treeSha = res.tree.sha;
 //        return github.createNewTreeFromSha(repoOwner, repoName, treeSha);
 //      })
 //      .then(function (res) {
 //        var newTreeSha = res.sha;
 //        return github.createCommit(repoOwner, repoName, sha, newTreeSha);
 //      })
 //      .then(function (res) {
 //        var newCommitSha = res.sha;
 //        return github.updateRef(repoOwner, repoName, branchName, newCommitSha);
 //      })
 //      .then(function (res) {
 //        return submitPR(repoOwner, repoName, branchName);
 //      });
 //  }




