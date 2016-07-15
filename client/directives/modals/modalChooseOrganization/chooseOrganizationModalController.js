'use strict';

require('app')
  .controller('ChooseOrganizationModalController', ChooseOrganizationModalController);
function ChooseOrganizationModalController(
  $interval,
  $q,
  $rootScope,
  $scope,
  $state,
  createNewSandboxForUserService,
  errs,
  featureFlags,
  fetchWhitelistedOrgsForDockCreated,
  keypather,
  grantedOrgs,
  getFirstDockStartedOrg,
  user,
  whitelistedOrgs
) {
  var COS = this;
  COS.user = user;
  $rootScope.featureFlags = featureFlags.flags;
  if (!$rootScope.featureFlags.autoWhitelist) {
    this.allAccounts = whitelistedOrgs.models;
  } else {
    this.allAccounts = grantedOrgs.models;
  }

  COS.cancelPolling = function () {
    if (COS.pollingInterval) {
      $interval.cancel(COS.pollingInterval);
    }
  };
  COS.pollForDockCreated = function (whitelistedDock, goToPanelCb) {
    COS.cancelPolling();
    COS.pollingInterval = $interval(function () {
      COS.fetchUpdatedWhitelistedOrg(whitelistedDock)
        .then(function (updatedOrg) {
          if (keypather.get(updatedOrg, 'attrs.firstDockCreated')) {
            COS.cancelPolling();
            return goToPanelCb('dockLoaded');
          }
        });
    }, 1000);
    $scope.$on('$destroy', COS.cancelPolling);
  };

  COS.getFirstDockOrg = function () {
    return whitelistedOrgs.models.find(function (org) {
      return keypather.get(org, 'attrs.firstDockCreated');
    });
  };
  COS.matchWhitelistedOrgByName = function (selectedOrgName) {
    return whitelistedOrgs.models.find(function (org) {
      return selectedOrgName === org.oauthName();
    });
  };
  COS.getSelectedOrg = function (selectedOrgName) {
    return COS.allAccounts.find(function (org) {
      return selectedOrgName === org.oauthName();
    });
  };

  COS.fetchUpdatedWhitelistedOrg = function (selectedOrgName) {
    return fetchWhitelistedOrgsForDockCreated()
      .then(function (res) {
        whitelistedOrgs = res;
        return COS.matchWhitelistedOrgByName(selectedOrgName);
      });
  };

  COS.getDockStatusPage = function (foundWhitelistedOrg) {
    if (keypather.get(foundWhitelistedOrg, 'attrs.firstDockCreated')) {
      return 'dockLoaded';
    }
    return 'dockLoading';
  };

  $scope.actions = {
    selectAccount: function (selectedOrgName) {
      var selectedOrg = selectedOrgName ? COS.getSelectedOrg(selectedOrgName) : COS.getFirstDockOrg();
      if (!selectedOrg) {
        return;
      }
      $scope.$emit('close-modal');
      $state.go('base.instances', {
        userName: selectedOrg.oauthName()
      });
    },
    initCheckForDockCreated: function (goToPanelCb) {
      if (!keypather.get(whitelistedOrgs, 'models.length')) { // If at least 1 org has been whitelisted, start polling
        return;
      }
      getFirstDockStartedOrg()
        .then(function (orgWithDock) {
          if (!orgWithDock) {
            COS.pollForDockCreated(orgWithDock, goToPanelCb);
          }
        });
    },
    createOrCheckDock: function (selectedOrgName, goToPanelCb) {
      var selectedOrg = COS.getSelectedOrg(selectedOrgName);
      if (!selectedOrg) {
        return;
      }
      return COS.fetchUpdatedWhitelistedOrg(selectedOrgName)
        .then(function (foundWhitelistedOrg) {
          if (foundWhitelistedOrg) {
            return foundWhitelistedOrg;
          }
          return createNewSandboxForUserService(selectedOrgName)
            .then(function () {
              COS.pollForDockCreated(foundWhitelistedOrg, goToPanelCb);
              return foundWhitelistedOrg;
            });
        })
        .catch(function (err) {
          errs.handler(err);
          return $q.reject(err);
        });
    }
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
