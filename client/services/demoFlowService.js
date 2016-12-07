'use strict';

require('app')
  .factory('demoFlowService', demoFlowService);

function demoFlowService(
  $localStorage,
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

  function endDemoFlow () {
    return isInDemoFlow() && patchOrgMetadata(currentOrg.poppa.id(), {
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

  function createDemoPR (instance) {
    var branchName = instance.getBranchName();
    var repoName = instance.getRepoName();
    var repoOwner = keypather.get(instance, 'attrs.owner.username');
    var sha = keypather.get(instance, 'contextVersion.appCodeVersions.models[0].attrs.commit');
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
        return github.createPR(repoOwner, repoName, 'master', branchName);
      });
  }

  function hasSeenHangTightMessage () {
    return $localStorage.hasSeenHangTightMessage;
  }

  function hasSeenUrlCallout () {
    return $localStorage.hasSeenUrlCallout;
  }

  function setIsUsingDemoRepo (value) {
    $localStorage.isUsingDemoRepo = value;
  }

  function isUsingDemoRepo () {
    return $localStorage.isUsingDemoRepo;
  }

  return {
    createDemoPR: createDemoPR,
    endDemoFlow: endDemoFlow,
    getItem: getItem,
    hasSeenHangTightMessage: hasSeenHangTightMessage,
    hasSeenUrlCallout: hasSeenUrlCallout,
    isInDemoFlow: isInDemoFlow,
    isUsingDemoRepo: isUsingDemoRepo,
    resetFlags: resetFlags,
    setIsUsingDemoRepo: setIsUsingDemoRepo,
    setItem: setItem
  };

}
