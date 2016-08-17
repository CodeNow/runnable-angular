'use strict';

require('app')
  .controller('ExpiredAccountController', ExpiredAccountController);

function ExpiredAccountController(
  close,
  $rootScope,
  $scope
) {
  var EAC = this;
  EAC.close = close;

  EAC.activeAccount = $rootScope.dataApp.data.activeAccount;

  EAC.actions = {
    close: function () {
      // Intentionally left blank, this prevents the modal from being closed
    },
    save: function () {
      $scope.$broadcast('go-to-panel', 'confirmationForm');
    }
  };
}
