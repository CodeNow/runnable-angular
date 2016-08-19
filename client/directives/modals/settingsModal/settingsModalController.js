'use strict';

require('app')
  .controller('SettingsModalController', SettingsModalController);

/**
 * @ngInject
 */
function SettingsModalController(
  $rootScope,
  close,
  subTab,
  tab
) {
  var SEMC = this;
  angular.extend(SEMC, {
    close: close,
    currentTab: tab,
    subTab: subTab
  });
  SEMC.activeAccount = $rootScope.dataApp.data.activeAccount;
  SEMC.showFooter = true;
}
