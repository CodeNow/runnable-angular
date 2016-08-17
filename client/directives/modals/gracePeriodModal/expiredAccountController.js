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
      close();
      console.log('Prevent close');
    },
    save: function () {
      $scope.$broadcast('go-to-panel', 'confirmationForm');
      console.log('SAVE');
    }
  };
}
