'use strict';

require('app')
  .factory('featureFlags', featureFlags);

function featureFlags(
  $localStorage
) {
  var defaultFeatureFlags = {
    billing: false,
    cardStatus: false,
    debugStartCmd: false, // debug mode for start CMD (in CMD Logs)
    editAnyInstance: false,
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
    newVerificationFlow: false,
    newVerificationFlowStackSelector: false,
    renameContainer: false,
    saveToolbar: false,
    teamManagement: false, // changes text from org to team in account menu
    themeToggle: false, // toggles the button that toggles theme
    updatedSlackValidation: false,
    webhooksAdminPresent: false,
    webhooksContainerRunning: false,
    webhooks: false
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
