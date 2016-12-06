'use strict';

require('app')
  .factory('demoFlowService', demoFlowService);

function demoFlowService(
  $localStorage,
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
    return !keypather.get(currentOrg, 'poppa.attrs.metadata.hasCompletedDemo');
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

  function checkInstanceAndAttachListener (instance, cb) {
    setItem('launchedFromContainersPage', true);
    instance.on('update', cb);
  }

  return {
    checkInstanceAndAttachListener: checkInstanceAndAttachListener,
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