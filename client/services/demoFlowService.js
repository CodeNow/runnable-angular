'use strict';

require('app')
  .factory('demoFlowService', demoFlowService);

function demoFlowService(
  $localStorage,
  currentOrg,
  keypather,
  patchOrgMetadata,
  promisify
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
    setIsUsingDemoRepo: setIsUsingDemoRepo,
    setItem: setItem
  };

}
