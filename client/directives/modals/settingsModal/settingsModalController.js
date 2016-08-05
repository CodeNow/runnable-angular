'use strict';

require('app')
  .controller('SettingsModalController', SettingsModalController);

/**
 * @ngInject
 */
function SettingsModalController(
  tab,
  close
) {
  var SEMC = this;
  angular.extend(SEMC, {
    currentTab: tab,
    close: close
  });
  SEMC.showFooter = true;
}
