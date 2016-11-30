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

  function setIsUsingDemoRepo (value) {
    $localStorage.isUsingDemoRepo = value;
  }

  function isUsingDemoRepo () {
    return $localStorage.isUsingDemoRepo;
  }

  return {
    hasSeenHangTightMessage: hasSeenHangTightMessage,
    hasSeenUrlCallout: hasSeenUrlCallout,
    isInDemoFlow: isInDemoFlow,
    isUsingDemoRepo: isUsingDemoRepo,
    setIsUsingDemoRepo: setIsUsingDemoRepo
  };

}
