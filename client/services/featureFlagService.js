'use strict';

require('app')
  .factory('featureFlags', featureFlags);

function featureFlags(
  $localStorage
) {
  var defaultFeatureFlags = {
    allowIsolatedUpdate: false,
    autoIsolation: false,
    autoIsolationSetup: false,
    backup: false,
    billing: false,
    cardStatus: false,
    connections: false,
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
    multilineFnR: false,
    multilineStartCmd: false,
    multipleRepositoryContainers: false, // for adding multiple containers with the same repository
    nameContainer: true,
    navListFilter: false,
    newUserPrompt: false, // modal for new users
    newVerificationFlow: true,
    newVerificationFlowStackSelector: true,
    noBuildLogs: true,
    optionsInModal: false, // allows delete in modal
    renameContainer: false,
    saveToolbar: false,
    teamManagement: false,
    teamManagementAdvanced: false, // changes text from org to team in account menu
    testingFeature: false,
    themeToggle: false, // toggles the button that toggles theme
    trial: false,
    updatedSlackValidation: true,
    webhooks: false,
    welcomeBack: false,
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
