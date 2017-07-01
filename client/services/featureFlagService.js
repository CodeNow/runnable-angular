'use strict';

require('app')
  .factory('featureFlags', featureFlags);

function featureFlags(
  $localStorage
) {
  var defaultFeatureFlags = {
    allowIsolatedUpdate: true,
    autoDeployError: false,
    autoIsolation: false,
    backup: false,
    cardStatus: false,
    composeDefaultBranch: true,
    composeEditing: false,
    composeErrors: false,
    composeInstance: true,
    composeNav: true,
    composeNewService: true,
    composeHistory: true,
    composeSSHKeys: true,
    composeSSHAuthView: false,
    composeTestingUpdate: false,
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
    envVars2: false, // new env vars
    fullScreen: false, // toggles full screen
    fullScreenToggle: false, // toggles the button that toggles full screen
    hideBilling: false,
    hideExplorer: false,
    hostnameNotifications: false,
    hostnameTool: false,
    gitHubScope: false,
    imAfraidOfTheDark: false, // toggles theme
    intercomOnMigration: false, // adds intercom link to migration message
    internalDebugging: false,
    inviteFlows: false,
    isPersonalAccount: false, // if account is a personal account
    kubernetes: false,
    limitBranches: false,
    mixAndMatchBranches: false,
    multilineFnR: false,
    multilineStartCmd: false,
    multipleRepositoryContainers: false, // for adding multiple containers with the same repository
    multipleWebhooks: true,
    multipleWebhooksRemovedPopover: false,
    navListFilter: false,
    nextPayment: false, // show the next payment date under payment summary
    optionsInModal: false, // allows delete in modal
    privateRegistry: true,
    renameContainer: false,
    saveToolbar: false,
    teamManagement: false,
    teamManagementAdvanced: false, // changes text from org to team in account menu
    testingFeature: false,
    testMenu: false, // show stubbed out test menu
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
