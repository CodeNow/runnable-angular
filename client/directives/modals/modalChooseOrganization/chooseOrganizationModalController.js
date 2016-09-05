'use strict';

require('app')
  .controller('ChooseOrganizationModalController', ChooseOrganizationModalController);
function ChooseOrganizationModalController(
  $interval,
  $rootScope,
  $scope,
  $state,
  createNewSandboxForUserService,
  currentOrg,
  errs,
  featureFlags,
  fetchWhitelistForDockCreated,
  keypather,
  loading,
  grantedOrgs,
  user,
  whitelistedOrgs
) {
  var COMC = this;
  COMC.user = user;
  loading.reset('chooseOrg');
  $rootScope.featureFlags = featureFlags.flags;
  COMC.allAccounts = grantedOrgs.models;
  COMC.whitelistedOrgs = whitelistedOrgs;

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

  $scope.actions = {
    selectAccount: function (selectedOrgName) {
      $state.go('base.instances', {
        userName: selectedOrgName
      }, {}, { reload: true });
    },
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
          COMC.pollForDockCreated(org, selectedOrgName, goToPanelCb);
        })
        .catch(errs.handler)
        .finally(function () {
          loading('chooseOrg', false);
        });
    }
  };

  // Searching methods
  COMC.getFirstDockOrg = function () {
    return COMC.whitelistedOrgs.find(function (org) {
      return keypather.get(org, 'attrs.firstDockCreated');
    });
  };
  COMC.matchWhitelistedOrgByName = function (selectedOrgName) {
    return COMC.whitelistedOrgs.find(function (org) {
      return selectedOrgName.toLowerCase() === org.attrs.name.toLowerCase();
    });
  };
  COMC.getSelectedOrg = function (selectedOrgName) {
    return COMC.allAccounts.find(function (org) {
      return selectedOrgName.toLowerCase() === org.oauthName().toLowerCase();
    });
  };

  // Polling stuff
  COMC.cancelPolling = function () {
    if (COMC.pollingInterval) {
      $interval.cancel(COMC.pollingInterval);
    }
  };
  COMC.pollForDockCreated = function (whitelistedDock, selectedOrgName, goToPanelCb) {
    COMC.cancelPolling();
    if (keypather.get(whitelistedDock, 'attrs.firstDockCreated')) {
      return goToPanelCb('dockLoaded');
    }
    goToPanelCb('dockLoading');

    COMC.pollingInterval = $interval(function () {
      COMC.fetchUpdatedWhitelistedOrg(selectedOrgName)
        .then(function (updatedOrg) {
          if (keypather.get(updatedOrg, 'attrs.firstDockCreated')) {
            COMC.cancelPolling();
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
