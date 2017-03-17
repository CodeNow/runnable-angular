'use strict';

require('app')
  .factory('featureFlags', featureFlags);

function featureFlags(
  $localStorage
) {
  var defaultFeatureFlags = {
    ahaBranchUrlStep: false,
    allowIsolatedUpdate: true,
    autoDeployError: false,
    autoIsolation: false,
    autoIsolationSetup: false,
    backup: false,
    cardStatus: false,
    composeInstance: false,
    composeNav: false,
    composeNewService: false,
    composeHistory: false,
    connections: false,
    contingencyPlan: false,
    demoAutoAddBranch: true,
    demoPersonalOnly: false, // no more demos for orgs
    demoOrgSelectUpdate: false, // updated org select for reduced github auth flow
    demoNoOrgs: false, // simulates no orgs in the org select upate
    demoPersistentAddTeam: false,
    demoUrlPolling: true,
    dockerCompose: true,
    dockerfileMirroringMultiple: false,
    editAnyInstance: false,
    emptyFolder: false, // shows empty folder markup
    fullScreen: false, // toggles full screen
    fullScreenToggle: false, // toggles the button that toggles full screen
    hideExplorer: false,
    hostnameNotifications: false,
    hostnameTool: false,
    gitHubScope: false,
    imAfraidOfTheDark: false, // toggles theme
    intercomOnMigration: false, // adds intercom link to migration message
    internalDebugging: false,
    inviteFlows: false,
    isPersonalAccount: false, // if account is a personal account
    multilineFnR: false,
    multilineStartCmd: false,
    multipleRepositoryContainers: false, // for adding multiple containers with the same repository
    navListFilter: false,
    nextPayment: false, // show the next payment date under payment summary
    optionsInModal: false, // allows delete in modal
    renameContainer: false,
    saveToolbar: false,
    showAddedService: false,
    showPrevTestSelected: false,
    showNonComposeServices: false,
    showComposeBranches: false,
    showPurpleBranch: false,
    teamManagement: false,
    teamManagementAdvanced: false, // changes text from org to team in account menu
    testingFeature: false,
    themeToggle: false, // toggles the button that toggles theme
    trial: false, // sets account to trial mode
    undoDelete: false, // undo delete configuration
    webhooks: false,
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
