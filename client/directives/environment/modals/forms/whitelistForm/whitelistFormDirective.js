'use strict';

require('app')
  .directive('ipWhitelist', ipWhitelistDirective);

function ipWhitelistDirective() {
  return {
    restrict: 'A',
    templateUrl: 'whitelistFormView',
    controller: 'WhitelistFormController',
    controllerAs: 'WFC',
    bindToController: true,
    scope: {
      whitelist: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.state = {
        isFocused: false
      };
    }
  };
}


