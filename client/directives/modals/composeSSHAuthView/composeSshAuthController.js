'use strict';

require('app')
  .controller('ComposeSshAuthController', ComposeSshAuthController);

function ComposeSshAuthController(
  $timeout,
  $window
) {
  $timeout(function () {
    $window.close();
  }, 3000);
}
