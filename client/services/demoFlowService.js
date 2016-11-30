'use strict';

require('app')
  .factory('demoFlowService', demoFlowService);

function demoFlowService(
  $localStorage,
  currentOrg,
  keypather,
  patchOrgMetadata
) {

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

  function hasSeenHangTightMessage () {
    return $localStorage.hasSeenHangTightMessage;
  }

  function hasSeenUrlCallout () {
    return $localStorage.hasSeenUrlCallout;
  }

  function showAddDemoBranch () {
    return isInDemoFlow() && hasSeenUrlCallout();
  }

  return {
    endDemoFlow: endDemoFlow,
    hasSeenHangTightMessage: hasSeenHangTightMessage,
    hasSeenUrlCallout: hasSeenUrlCallout,
    isInDemoFlow: isInDemoFlow,
    showAddDemoBranch: showAddDemoBranch
  };

}
