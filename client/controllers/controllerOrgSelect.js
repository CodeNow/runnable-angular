'use strict';

require('app')
  .controller('ControllerOrgSelect', ControllerOrgSelect);
function ControllerOrgSelect(
  $scope,
  $state,
  user,
  orgs
) {
  this.allAccounts = [user].concat(orgs.models);
  $scope.actions = {
    selectAccount: function (account) {
      $scope.$emit('close-modal');
      $state.go('base.instances', {
        userName: account.oauthName()
      });
    }
  };
}
