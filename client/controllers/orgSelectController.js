'use strict';

require('app')
  .controller('OrgSelectController', OrgSelectController);

function OrgSelectController(
  ModalService,

  // Injected Values
  grantedOrgs,
  user,
  whitelistedOrgs
) {
  ModalService.showModal({
    controller: 'ChooseOrganizationModalController',
    controllerAs: 'COMC',
    templateUrl: 'chooseOrganizationModalView',
    inputs: {
      grantedOrgs: grantedOrgs,
      user: user,
      whitelistedOrgs: whitelistedOrgs
    }
  });
}
