'use strict';

require('app')
  .controller('ChooseOrganizationModalController', ChooseOrganizationModalController);
function ChooseOrganizationModalController(
  $interval,
  $q,
  $rootScope,
  $scope,
  $state,
  ahaGuide,
  configEnvironment,
  createNewSandboxForUserService,
  currentOrg,
  customWindowService,
  errs,
  eventTracking,
  featureFlags,
  fetchWhitelistForDockCreated,
  github,
  keypather,
  loading,
  promisify,

  // Injected
  close,
  grantedOrgs,
  user,
  whitelistedOrgs
) {
  var COMC = this;
  COMC.close = close;
  COMC.user = user;
  loading.reset('chooseOrg');
  $rootScope.featureFlags = featureFlags.flags;
  COMC.allAccounts = grantedOrgs;
  COMC.whitelistedOrgs = whitelistedOrgs;
  var nonPersonalWhitelistedOrgs = whitelistedOrgs.filter(function (org) {
    return !org.attrs.isPersonalAccount;
  });
  COMC.personalAccountOnly = grantedOrgs.models.length === 0 && nonPersonalWhitelistedOrgs.length === 0;
  COMC.demoOrg = null;

  COMC.defaultBasePanel = 'orgSelection';

  COMC.isInDemoFlow = false;

  $scope.$broadcast('go-to-panel', COMC.defaultBasePanel, 'immediate');

  COMC.cancelPollingForWhitelisted = function () {
    if (COMC.pollForWhitelistPromise) {
      $interval.cancel(COMC.pollForWhitelistPromise);
    }
  };

  COMC.cancelPollingForDockCreated = function () {
    if (COMC.pollForDockCreatedPromise) {
      $interval.cancel(COMC.pollForDockCreatedPromise);
    }
  };

  COMC.grantAccess = function (isDemo) {
    var loadingString = 'grantAccess';
    if (isDemo) {
      loadingString = 'grantAccessDemo';
    }

    var connectionUrl = '/githubAuth';

    if (isDemo) {
      connectionUrl = connectionUrl + '?isDemo=true';
    }
    var customWindow = customWindowService(connectionUrl, {
      width: 1020, // match github minimum width
      height: 730
    });
    loading.reset(loadingString);
    loading(loadingString, true);
    COMC.cancelPollingForWhitelisted();

    return $q(function (resolve) {
      var originalOrgList = grantedOrgs.models.map(function (org) {
        return org.oauthName().toLowerCase();
      });
      COMC.newOrgList = [];
      COMC.pollForWhitelistPromise = $interval(function () {
        promisify(grantedOrgs, 'fetch')({'_bustCache': Math.random()})
          .then(function (orgs) {
            COMC.newOrgList = orgs.models.filter(function (org) {
              return !originalOrgList.includes(org.oauthName().toLowerCase());
            });
            if (COMC.newOrgList.length) {
              COMC.showGrantAccess = false;
              loading(loadingString, false);
              resolve();
              COMC.cancelPollingForWhitelisted();
              customWindow.close();
              if (COMC.newOrgList.length === 1) {
                COMC.actions.createOrCheckDock(COMC.newOrgList[0].oauthName());
              } else if (COMC.newOrgList.length > 1) {
                $scope.$broadcast('go-to-panel', 'orgSelection');
              }
            }
          });
      }, 1000 * 5);
    });
  };

  COMC.creatingOrg = false;

  COMC.createOrg = function () {
    COMC.creatingOrg = true;
    customWindowService('https://github.com/organizations/new');
  };

  $scope.$on('$destroy', function () {
    COMC.cancelPollingForWhitelisted();
    COMC.cancelPollingForDockCreated();
  });


  // otherwise the user can clear away the model
  // this will be re-added when they transition to something else
  keypather.set($rootScope, 'dataApp.documentKeydownEventHandler', null);

  COMC.fetchUpdatedWhitelistedOrg = function (selectedOrgName) {
    return fetchWhitelistForDockCreated()
      .then(function (res) {
        COMC.whitelistedOrgs = res;
        return COMC.matchWhitelistedOrgByName(selectedOrgName);
      });
  };

  COMC.actions = {
    createOrCheckDock: function (selectedOrgName) {
      var selectedOrg = COMC.getSelectedOrg(selectedOrgName);
      if (!selectedOrg) {
        return;
      }
      loading('chooseOrg', true);
      return COMC.fetchUpdatedWhitelistedOrg(selectedOrgName)
        .then(function (foundWhitelistedOrg) {
          if (foundWhitelistedOrg) {
            return foundWhitelistedOrg;
          }
          return createNewSandboxForUserService(selectedOrgName)
            .then(function () {
              return null;
            });
        })
        .then(function (org) {
          eventTracking.spunUpInfrastructure();
          if (keypather.get(org, 'attrs.firstDockCreated')) {
            return COMC.actions.selectAccount(selectedOrgName);
          }
          eventTracking.updateCurrentPersonProfile(ahaGuide.getCurrentStep(), selectedOrgName);
          COMC.pollForDockCreated(org, selectedOrgName);
        })
        .catch(errs.handler)
        .finally(function () {
          loading('chooseOrg', false);
        });
    },
    selectAccount: function (selectedOrgName) {
      // Update number of orgs for user
      eventTracking.updateCurrentPersonProfile(ahaGuide.getCurrentStep(), selectedOrgName);
      close();
      $state.go('base.instances', {
        userName: selectedOrgName
      });
    }
  };

  // Searching methods
  COMC.matchWhitelistedOrgByName = function (selectedOrgName) {
    return COMC.whitelistedOrgs.find(function (org) {
      return selectedOrgName.toLowerCase() === org.attrs.name.toLowerCase();
    });
  };
  COMC.getSelectedOrg = function (selectedOrgName) {
    var selectedOrg = COMC.allAccounts.models.find(function (org) {
      return selectedOrgName.toLowerCase() === org.oauthName().toLowerCase();
    });
    if (!selectedOrg) {
      selectedOrg = COMC.user;
    }
    return selectedOrg;
  };
  COMC.isChoosingOrg = ahaGuide.isChoosingOrg;

  COMC.selectedOrgName = null;
  COMC.pollForDockCreated = function (whitelistedDock, selectedOrgName) {
    COMC.selectedOrgName = selectedOrgName;
    COMC.cancelPollingForDockCreated();
    if (keypather.get(whitelistedDock, 'attrs.firstDockCreated')) {
      return $scope.$broadcast('go-to-panel', 'dockLoaded');
    }
    $scope.$broadcast('go-to-panel', 'dockLoading');

    COMC.pollForDockCreatedPromise = $interval(function () {
      COMC.fetchUpdatedWhitelistedOrg(selectedOrgName)
        .then(function (updatedOrg) {
          if (keypather.get(updatedOrg, 'attrs.firstDockCreated')) {
            // Update number of orgs for user
            eventTracking.updateCurrentPersonProfile(ahaGuide.getCurrentStep(), keypather.get(updatedOrg, 'attra.name'));
            COMC.cancelPollingForDockCreated();
            return $scope.$broadcast('go-to-panel', 'dockLoaded');
          }
        });
    }, 1000);
  };

  // Since this is a root route, it needs this stuff
  $scope.$watch(function () {
    return errs.errors.length;
  }, function (n) {
    if (n) {
      keypather.set($rootScope, 'dataApp.data.modalError.data.errors', errs.errors);
      keypather.set($rootScope, 'dataApp.data.modalError.data.in', true);
    }
  });

  keypather.set($rootScope, 'dataApp.data.modalError.actions', {
    close: function () {
      errs.clearErrors();
      keypather.set($rootScope, 'dataApp.data.modalError.data.in', false);
    }
  });
}
