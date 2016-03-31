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
    dockerfileMirroring: false,
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
    isolationUI: true, // for isolation UI
    isolationRepos: true, // for isolation UI
    multilineFnR: false,
    nameContainer: false,
    navListFilter: false,
    newUserPrompt: false, // modal for new users
    newVerificationFlow: true,
    newVerificationFlowStackSelector: true,
    noBuildLogs: true,
    renameContainer: false,
    saveToolbar: false,
    teamManagement: true, // changes text from org to team in account menu
    teamManagementAdvanced: false,
    trial: false,
    themeToggle: false, // toggles the button that toggles theme
    updatedSlackValidation: true,
    urlPopover: false,
    webhooksAdminPresent: false,
    webhooksContainerRunning: false,
    webhooks: false,
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
