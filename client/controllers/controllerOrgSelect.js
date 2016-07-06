'use strict';

require('app')
  .controller('ControllerOrgSelect', ControllerOrgSelect);
function ControllerOrgSelect(
  $rootScope,
  $scope,
  $state,
  featureFlags,
  orgs
) {
  $rootScope.featureFlags = featureFlags.flags;
  this.allAccounts = orgs.models;
  $scope.actions = {
    selectAccount: function (account) {
      $scope.$emit('close-modal');
      $state.go('base.instances', {
        userName: account.oauthName()
      });
    }
  };
}
