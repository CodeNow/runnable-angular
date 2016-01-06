'use strict';

require('app')
  .directive('ipWhitelist', ipWhitelistDirective);

function ipWhitelistDirective() {
  return {
    restrict: 'A',
    templateUrl: 'whitelistFormView',
    controller: 'WhitelistFormController',
    controllerAs: 'WFC',
    bindtoController: true,
    scope: {
      whitelist: '= whitelist'
    },
    link: function ($scope, elem, attrs) {
      $scope.state = {
        isFocused: false
      };
    }
  };
}


