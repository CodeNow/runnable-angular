'use strict';

require('app')
  .factory('featureFlags', featureFlags);

function featureFlags(
  $localStorage
) {
  var defaultFeatureFlags = {
    backup: false,
    billing: false,
    cardStatus: false,
    connections: false,
    dockerfileMirroring: true,
    dockerfileMirroringMultiple: false,
    editAnyInstance: false,
    emptyFolder: false, // shows empty folder markup
    fullScreen: false,  // toggles full screen
    fullScreenToggle: false,  // toggles the button that toggles full screen
    hostnameNotifications: false,
    hostnameTool: false,
    imAfraidOfTheDark: false, // toggles theme
    intercomOnMigration: false, // adds intercom link to migration message
    internalDebugging: false,
    inviteFlows: false,
    isolationRepos: true, // for isolation UI
    isolationUI: true, // for isolation UI
    isolationCommitSyncing: false,
    multilineFnR: false,
    multilineStartCmd: false,
    multipleRepositoryContainers: false, // for adding multiple containers with the same repository
    nameContainer: false,
    navListFilter: false,
    newUserPrompt: false, // modal for new users
    newVerificationFlow: true,
    newVerificationFlowStackSelector: true,
    noBuildLogs: true,
    optionsInModal: false, // allows delete in modal
    renameContainer: false,
    saveToolbar: false,
    serviceContainersInConnections: false, // shows service containers in the Connections popover
    teamManagement: true, // changes text from org to team in account menu
    teamManagementAdvanced: false,
    testingFeature: false,
    themeToggle: false, // toggles the button that toggles theme
    trial: false,
    updatedSlackValidation: true,
    webhooks: false,
    webhooksAdminPresent: false,
    webhooksContainerRunning: false,
    whitelist: true,
    whitelistIpFiltering: false
  };

  var _featureFlags = {};


  Object.keys(defaultFeatureFlags).forEach(function (key) {
    _featureFlags[key] = defaultFeatureFlags[key];
  });

  if($localStorage.featureFlags){
    Object.keys($localStorage.featureFlags).forEach(function (flag) {
      _featureFlags[flag] = $localStorage.featureFlags[flag];
    });
  }

  return {
    reset: function () {
      Object.keys(defaultFeatureFlags).forEach(function (key) {
        _featureFlags[key] = defaultFeatureFlags[key];
      });
      return _featureFlags;
    },
    flags: _featureFlags,
    changed: function () {
      return !!Object.keys(defaultFeatureFlags).find(function (featureFlag) {
        return defaultFeatureFlags[featureFlag] !== _featureFlags[featureFlag];
      });
    }
  };
}
