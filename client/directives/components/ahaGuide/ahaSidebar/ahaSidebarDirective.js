'use strict';

require('app')
  .directive('ahaSidebar', ahaSidebar);

function ahaSidebar() {
  return {
    restrict: 'A',
    templateUrl: 'ahaSidebarView',
    controller: 'AhaSidebarController',
    controllerAs: 'ASC',
    bindToController: true,
    scope: {
      toggleSidebar: '='
    }
  };
}
