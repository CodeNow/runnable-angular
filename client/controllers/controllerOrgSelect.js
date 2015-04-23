'use strict';

require('app')
  .controller('ControllerOrgSelect', ControllerOrgSelect);
/**
 * ControllerApp
 * @constructor
 * @export
 * @ngInject
 */
function ControllerOrgSelect(
  $scope,
  $state
) {
  $scope.actions = {
    selectAccount: function (account) {
      $scope.$emit('close-modal');
      $state.go('instance.home', {
        userName: account.oauthName()
      });
    }
  };
}
