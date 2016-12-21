'use strict';

require('app')
  .factory('demoFlowService', demoFlowService);

function demoFlowService(
  $http,
  $localStorage,
  $rootScope,
  $q,
  currentOrg,
  github,
  defaultContainerUrl,
  featureFlags,
  keypather,
  patchOrgMetadata
) {

  if (isInDemoFlow()) {
    $rootScope.$on('demo::completed', function () {
      endDemoFlow();
    });
  }

  function resetFlags () {
    $localStorage.hasSeenHangTightMessage = false;
    $localStorage.usingDemoRepo = false;
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
              resetFlags();
              currentOrg.poppa.attrs.metadata = updatedOrg.metadata;
            });
        }
       });
  }

  function checkStatusOnInstance (instance) {
    // This is needed to fix an issue with 'Response for preflight has invalid HTTP status code 404'
    $http.defaults.headers.common = {};
    var url = defaultContainerUrl(instance, true);
    return $http.get(url)
      .then(function (res) {
        return res.status >= 200 && res.status < 300;
      })
      .catch(function () {
        return true;
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

  function setUsingDemoRepo (value) {
    $localStorage.usingDemoRepo = value;
  }

  function hasAddedBranch (value) {
    if (value !== undefined) {
      $localStorage.hasAddedBranch = value;
    }
    return $localStorage.hasAddedBranch;
  }

  function usingDemoRepo () {
    return $localStorage.usingDemoRepo;
  }
  $rootScope.$on('demo::dismissUrlCallout', function ($event, instanceId) {
    if (!hasSeenUrlCallout()) {
      setItem('hasSeenUrlCallout', instanceId);
    }
  });

  function shouldAddPR () {
    return currentOrg.isPersonalAccount() && usingDemoRepo();
  }
  function shouldShowTeamCTA () {
    return featureFlags.flags.teamCTA && currentOrg.isPersonalAccount() && !isInDemoFlow();
  }

  function shouldShowServicesCTA () {
    return featureFlags.flags.demoMultiTierAddRepo && !isInDemoFlow();
  }

  return {
    checkStatusOnInstance: checkStatusOnInstance,
    endDemoFlow: endDemoFlow,
    getItem: getItem,
    hasAddedBranch: hasAddedBranch,
    hasSeenHangTightMessage: hasSeenHangTightMessage,
    hasSeenUrlCallout: hasSeenUrlCallout,
    shouldAddPR: shouldAddPR,
    isInDemoFlow: isInDemoFlow,
    usingDemoRepo: usingDemoRepo,
    resetFlags: resetFlags,
    setUsingDemoRepo: setUsingDemoRepo,
    setItem: setItem,
    submitDemoPR: submitDemoPR,
    shouldShowTeamCTA: shouldShowTeamCTA,
    shouldShowServicesCTA: shouldShowServicesCTA
  };
}
