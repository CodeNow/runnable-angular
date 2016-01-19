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
    editAnyInstance: false,
    emptyFolder: false, // shows empty folder markup
    fullScreen: false,  // toggles full screen
    fullScreenToggle: false,  // toggles the button that toggles full screen
    hostnameNotifications: false,
    hostnameTool: false,
    imAfraidOfTheDark: false, // toggles theme
    internalDebugging: false,
    inviteFlows: false,
    isolationNav: false, // for isolation nav
    isolationUI: false, // for isolation UI
    multilineFnR: false,
    nameContainer: false,
    navListFilter: false,
    newVerificationFlow: true,
    newVerificationFlowStackSelector: true,
    noBuildLogs: true,
    renameContainer: false,
    saveToolbar: false,
    teamManagement: true, // changes text from org to team in account menu
    teamManagementAdvanced: false,
    trial: false,
    themeToggle: false, // toggles the button that toggles theme
    updatedSlackValidation: false,
    urlPopover: false,
    webhooksAdminPresent: false,
    webhooksContainerRunning: false,
    webhooks: false,
    whitelist: false
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
