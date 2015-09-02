'use strict';

require('app')
  .factory('featureFlags', featureFlags);

function featureFlags(
  $localStorage
) {
  var defaultFeatureFlags = {
    additionalRepositories: true,
    cardStatus: false,
    debugMode: true,
    debugStartCmd: false, // debug mode for start CMD (in CMD Logs)
    fullScreen: false,  // toggles full screen
    fullScreenToggle: false,  // toggles the button that toggles full screen
    hostnameNotifications: false,
    hostnameTool: false,
    imAfraidOfTheDark: false, // toggles theme
    internalDebugging: false,
    isolationActive: false, // if isolation is active
    isolationSetUp: false, // if isolation is setup
    isolationUI: false, // for isolation UI
    nameContainer: false,
    multilineFnR: false,
    navListFilter: false,
    newVerificationFlow: false,
    renameContainer: false,
    saveToolbar: false,
    themeToggle: false, // toggles the button that toggles theme
    updatedBuildLogs: true,
    updatedSlackValidation: false
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
    flags: _featureFlags
  };
}
