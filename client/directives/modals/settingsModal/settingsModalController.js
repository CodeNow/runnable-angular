'use strict';

require('app')
  .controller('SettingsModalController', SettingsModalController);

/**
 * @ngInject
 */
function SettingsModalController(
  tab,
  close,
  $scope
) {
  var SEMC = this;
  angular.extend(SEMC, {
    currentTab: tab,
    close: close
  });
  SEMC.showFooter = true;
  SEMC.activeAccount = $scope.dataApp.data.activeAccount;
}
