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
  $state,
  keypather
) {
  $scope.actions = {
    selectAccount: function (account) {
      var username = keypather.get(account, 'attrs.accounts.github.username');
      if (!username) {
        username = keypather.get(account, 'attrs.login');
      }
      $scope.$emit('close-modal');
      $state.go('instance.home', {
        userName: username
      });
    }
  };
}
