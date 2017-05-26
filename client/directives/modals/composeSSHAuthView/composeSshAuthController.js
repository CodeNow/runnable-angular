'use strict';

require('app')
  .controller('ComposeSshAuthController', ComposeSshAuthController);

function ComposeSshAuthController(
  $timeout,
  $window,
  $scope,
  $rootScope
) {
  $scope.$emit('GH_SCOPE_UPGRADED');

  $scope.testEmit = function() {

    $rootScope.$broadcast('GH_SCOPE_UPGRADED');
    // $window.dispatchEvent('GH_SCOPE_UPGRADED')
    console.log($window);
  };

  // $timeout(function () {
  //   $window.close();
  // }, 3000)
}
