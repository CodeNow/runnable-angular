'use strict';

require('app')
  .controller('SettingsModalController', SettingsModalController);

/**
 * @ngInject
 */
function SettingsModalController(
  close,
  keypather,
  subTab,
  tab,
  currentOrg
) {
  var SEMC = this;
  angular.extend(SEMC, {
    close: close,
    currentTab: tab,
    subTab: subTab
  });
  SEMC.currentOrg = currentOrg;
  SEMC.showFooter = true;
  SEMC.isPersonalAccount = keypather.get(currentOrg, 'poppa.attrs.isPersonalAccount');
}
