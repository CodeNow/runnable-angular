'use strict';

require('app')
  .controller('InfrastructureReadyController', InfrastructureReadyController);

function InfrastructureReadyController(
  $interval,
  $q,
  $scope,
  $state,
  ahaGuide,
  currentOrg,
  createNewSandboxForUserService,
  errs,
  eventTracking,
  fetchGrantedGithubOrgs,
  fetchUser,
  fetchWhitelistForDockCreated,
  keypather,
  loading
) {
  var IR = this;
  IR.currentOrg = currentOrg;

  fetchUser()
    .then(function (user) {
      IR.user = user;
    });

  IR.getSelectedOrg = function (selectedOrgName) {
    return $q.all([
      fetchGrantedGithubOrgs(),
      fetchUser()
    ])
      .then(function (res) {
        var selectedOrg = res[0].models.find(function (org) {
          return selectedOrgName.toLowerCase() === org.oauthName().toLowerCase();
        });
        if (!selectedOrg) {
          selectedOrg = res[1];
        }
        return selectedOrg;
      });
  };

  IR.fetchUpdatedWhitelistedOrg = function (selectedOrgName) {
    return fetchWhitelistForDockCreated()
      .then(function (whiteListedOrgs) {
        return IR.matchWhitelistedOrgByName(whiteListedOrgs, selectedOrgName);
      });
  };

  IR.matchWhitelistedOrgByName = function (whiteListedOrgs, selectedOrgName) {
    return whiteListedOrgs.find(function (org) {
      return selectedOrgName.toLowerCase() === org.attrs.name.toLowerCase();
    });
  };

  IR.createOrCheckDock = function (selectedOrgName) {
    var selectedOrg = IR.getSelectedOrg(selectedOrgName);
    if (!selectedOrg) {
      return;
    }
    loading('chooseOrg', true);
    return IR.fetchUpdatedWhitelistedOrg(selectedOrgName)
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
          return;
        }
        eventTracking.updateCurrentPersonProfile(ahaGuide.getCurrentStep(), selectedOrgName);
        IR.pollForDockCreated(org, selectedOrgName);
      })
      .catch(errs.handler)
      .finally(function () {
        loading('chooseOrg', false);
      });
  };

  IR.pollForDockCreated = function (whitelistedDock, selectedOrgName) {
    IR.cancelPollingForDockCreated();
    if (keypather.get(whitelistedDock, 'attrs.firstDockCreated')) {
      return $scope.$broadcast('go-to-panel', 'dockLoaded');
    }
    $scope.$broadcast('go-to-panel', 'dockLoading');

    IR.pollForDockCreatedPromise = $interval(function () {
      IR.fetchUpdatedWhitelistedOrg(selectedOrgName)
        .then(function (updatedOrg) {
          if (keypather.get(updatedOrg, 'attrs.firstDockCreated')) {
            // Update number of orgs for user
            eventTracking.updateCurrentPersonProfile(ahaGuide.getCurrentStep(), keypather.get(updatedOrg, 'attra.name'));
            IR.cancelPollingForDockCreated();
            return $scope.$broadcast('go-to-panel', 'dockLoaded');
          }
        });
    }, 1000);
  };

  IR.cancelPollingForDockCreated = function () {
    if (IR.pollForDockCreatedPromise) {
      $interval.cancel(IR.pollForDockCreatedPromise);
    }
  };

  $scope.$on('$destroy', function () {
    IR.cancelPollingForDockCreated();
  });

  IR.goToOrgSelect = function () {
    $state.go('orgSelect');
  };

  // Init
  IR.createOrCheckDock(currentOrg.poppa.attrs.name);
}
