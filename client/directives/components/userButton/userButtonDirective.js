'use strict';

require('app')
  .directive('userButton', userButton);

function userButton () {
  return {
    restrict: 'A',
    controller: 'UserButtonController',
    controllerAs: 'UBC',
    replace: true,
    templateUrl: 'userButtonView',
    scope: {
      user: '='
    },
    link: function ($scope) {
      window.$scope = $scope;
      console.log('UserButton', $scope);
    }
  };
}
