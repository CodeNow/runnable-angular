'use strict';

require('app')
  .factory('demoFlowService', demoFlowService);

function demoFlowService(
  $localStorage,
  $q,
  currentOrg,
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
    } else {
      return $q.when();
    }
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