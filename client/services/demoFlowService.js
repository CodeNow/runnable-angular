'use strict';

require('app')
  .factory('demoFlowService', demoFlowService);

function demoFlowService(
  $localStorage,
  currentOrg,
  keypather
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

  function hasSeenHangTightMessage () {
    return $localStorage.hasSeenHangTightMessage;
  }

  function hasSeenUrlCallout () {
    return $localStorage.hasSeenUrlCallout;
  }

  return {
    hasSeenHangTightMessage: hasSeenHangTightMessage,
    hasSeenUrlCallout: hasSeenUrlCallout,
    isInDemoFlow: isInDemoFlow
  };

}
