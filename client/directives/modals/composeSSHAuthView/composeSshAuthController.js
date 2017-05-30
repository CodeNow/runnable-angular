'use strict';

require('app')
  .controller('ComposeSshAuthController', ComposeSshAuthController);

function ComposeSshAuthController(
  $timeout,
  $window,
  $scope
) {
  $scope.$emit('GH_SCOPE_UPGRADED');

  $timeout(function () {
    $window.close();
  }, 3000);
}
