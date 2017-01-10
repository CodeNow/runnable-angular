'use strict';

require('app')
  .controller('InfrastructureReadyController', InfrastructureReadyController);

function InfrastructureReadyController(
) {


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
