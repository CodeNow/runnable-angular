'use strict';

require('app')
  .controller('ChooseOrganizationModalController', ChooseOrganizationModalController);
function ChooseOrganizationModalController(
  $interval,
  $rootScope,
  $scope,
  $state,
  ahaGuide,
  configEnvironment,
  createNewSandboxForUserService,
  customWindowService,
  errs,
  eventTracking,
  featureFlags,
  fetchWhitelistForDockCreated,
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

  COMC.showGrantAccess = COMC.allAccounts.models.length === 0;

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

  COMC.grantAccess = function () {
    // var customWindow = customWindowService('/githubAuth');
    // console.log(customWindow);

    loading.reset('grantAccess');
    loading('grantAccess', true);
    COMC.cancelPollingForWhitelisted();
    var originalOrgCount = grantedOrgs.models.length;
    COMC.pollForWhitelistPromise = $interval(function () {
      promisify(grantedOrgs, 'fetch')({'_bustCache': Math.random()})
        .then(function (orgs) {
          if (orgs.models.length !== originalOrgCount) {
            COMC.showGrantAccess = false;
            loading('grantAccess', false);
          }
        });
    }, 1000 * 5);

    var topBar = window.outerHeight - window.innerHeight;
    var padding = 30;
    var width = 770;
    var height = 730;
    var top = window.screenTop + padding + topBar;
    var left = (window.screen.width/2) - (width/2);
    return window.open('/githubAuth', 'page', 'toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=0,width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',titlebar=yes');
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
    trackFigureAction: eventTracking.trackFigureAction,
    trackCreateOrgLink: eventTracking.trackCreateOrgLink,
    trackPersonalAccount: eventTracking.trackPersonalAccount,
    createOrCheckDock: function (selectedOrgName, goToPanelCb) {
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
          if (keypather.get(org, 'attrs.firstDockCreated')) {
            return COMC.actions.selectAccount(selectedOrgName);
          }

          COMC.pollForDockCreated(org, selectedOrgName, goToPanelCb);
        })
        .catch(errs.handler)
        .finally(function () {
          loading('chooseOrg', false);
        });
    },
    selectAccount: function (selectedOrgName) {
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
    return COMC.allAccounts.models.find(function (org) {
      return selectedOrgName.toLowerCase() === org.oauthName().toLowerCase();
    });
  };
  COMC.isChoosingOrg = ahaGuide.isChoosingOrg;

  COMC.selectedOrgName = null;
  COMC.pollForDockCreated = function (whitelistedDock, selectedOrgName, goToPanelCb) {
    COMC.selectedOrgName = selectedOrgName;
    COMC.cancelPollingForDockCreated();
    if (keypather.get(whitelistedDock, 'attrs.firstDockCreated')) {
      return goToPanelCb('dockLoaded');
    }
    goToPanelCb('dockLoading');

    COMC.pollForDockCreatedPromise = $interval(function () {
      COMC.fetchUpdatedWhitelistedOrg(selectedOrgName)
        .then(function (updatedOrg) {
          if (keypather.get(updatedOrg, 'attrs.firstDockCreated')) {
            COMC.cancelPollingForDockCreated();
            return goToPanelCb('dockLoaded');
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
