
'use strict';

require('app')
  .controller('AhaSidebarController', AhaSidebarController);

function AhaSidebarController(
  $scope,
  $rootScope,
  serviceAhaGuide
) {
  console.log('instantiated');
}
