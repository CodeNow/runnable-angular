'use strict';

require('app')
  .factory('demoFlowService', demoFlowService);

function demoFlowService(
  $localStorage,
  currentOrg,
  keypather,
  patchOrgMetadata
) {

  var listenerHash = {};

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

  function addListener ($scope, obj, value, cb) {
    var stateWatcher = $scope.$watch(function () {
      return keypather.get(obj, value);
    }, function (newValue, oldValue) {
      cb(newValue, oldValue);
    });
    listenerHash[value] = stateWatcher;
  }

  function removeListener (value) {
    listenerHash[value]();
    delete listenerHash[value];
  }

  return {
    addListener: addListener,
    endDemoFlow: endDemoFlow,
    hasSeenHangTightMessage: hasSeenHangTightMessage,
    hasSeenUrlCallout: hasSeenUrlCallout,
    isInDemoFlow: isInDemoFlow,
    isUsingDemoRepo: isUsingDemoRepo,
    removeListener: removeListener,
    setIsUsingDemoRepo: setIsUsingDemoRepo
  };

}
