'use strict';

require('app')
  .factory('featureFlags', featureFlags);

function featureFlags(
  $localStorage
) {
  var defaultFeatureFlags = {
    additionalRepositories: true,
    billing: false,
    cardStatus: false,
    debugMode: true,
    debugStartCmd: false, // debug mode for start CMD (in CMD Logs)
    fullScreen: false,  // toggles full screen
    fullScreenToggle: false,  // toggles the button that toggles full screen
    hostnameNotifications: false,
    hostnameTool: false,
    imAfraidOfTheDark: false, // toggles theme
    internalDebugging: false,
    isolationNav: false, // for isolation nav
    isolationUI: false, // for isolation UI
    multilineFnR: false,
    nameContainer: false,
    navListFilter: false,
    newNavigation: false, // for isolation UI
    newVerificationFlow: false,
    newVerificationFlowStackSelector: false,
    renameContainer: false,
    saveToolbar: false,
    teamUI: false, // changes text from org to team in account menu
    themeToggle: false, // toggles the button that toggles theme
    updatedBuildLogs: true,
    updatedSlackValidation: false,
    webhooksOff: false,
    webhooksToggling: false
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
