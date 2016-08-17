'use strict';

require('app')
  .controller('SettingsModalController', SettingsModalController);

/**
 * @ngInject
 */
function SettingsModalController(
  tab,
  close,
  $rootScope
) {
  var SEMC = this;
  angular.extend(SEMC, {
    currentTab: tab,
    close: close
  });
  SEMC.showFooter = true;
  SEMC.activeAccount = $rootScope.dataApp.data.activeAccount;
}
