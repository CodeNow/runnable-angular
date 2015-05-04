'use strict';

require('app')
  .controller('ControllerOrgSelect', ControllerOrgSelect);
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
