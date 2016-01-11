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

      var verificationPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      $scope.isFormValid = function () {
        if (!verificationPattern.test($scope.WFC.fromAddress)) {
          return false;
        }
        if ($scope.WFC.isRange && !verificationPattern.test($scope.WFC.toAddress)) {
          return false;
        }
        return true;
      };
    }
  };
}


