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
  fetchWhitelistForDockCreated,
  keypather,
  loading,
  grantedOrgs,
  user,
  whitelistedOrgs
) {
  var COS = this;
  COS.user = user;
  loading.reset('chooseOrg');
  $rootScope.featureFlags = featureFlags.flags;
  if (!$rootScope.featureFlags.autoWhitelist) {
    this.allAccounts = whitelistedOrgs;
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
    if (keypather.get(whitelistedDock, 'attrs.firstDockCreated')) {
      return goToPanelCb('dockLoaded');
    }
    goToPanelCb('dockLoading');

    COS.pollingInterval = $interval(function () {
      COS.fetchUpdatedWhitelistedOrg(whitelistedDock.attrs.name)
        .then(function (updatedOrg) {
          if (keypather.get(updatedOrg, 'attrs.firstDockCreated')) {
            COS.cancelPolling();
            return goToPanelCb('dockLoaded');
          }
        });
    }, 1000);
  };

  COS.getFirstDockOrg = function () {
    return whitelistedOrgs.find(function (org) {
      return keypather.get(org, 'attrs.firstDockCreated');
    });
  };
  COS.matchWhitelistedOrgByName = function (selectedOrgName) {
    return whitelistedOrgs.find(function (org) {
      return selectedOrgName.toLowerCase() === org.attrs.name.toLowerCase();
    });
  };
  COS.getSelectedOrg = function (selectedOrgName) {
    return COS.allAccounts.find(function (org) {
      return selectedOrgName === org.oauthName();
    });
  };

  COS.fetchUpdatedWhitelistedOrg = function (selectedOrgName) {
    return fetchWhitelistForDockCreated()
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
    createOrCheckDock: function (selectedOrgName, goToPanelCb) {
      loading('chooseOrg', true);
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
              return COS.fetchUpdatedWhitelistedOrg(selectedOrgName);
            });
        })
        .then(function (org) {
          COS.pollForDockCreated(org, goToPanelCb);
        })
        .catch(function (err) {
          errs.handler(err);
          return $q.reject(err);
        })
        .finally(function () {
          loading('chooseOrg', false);
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
