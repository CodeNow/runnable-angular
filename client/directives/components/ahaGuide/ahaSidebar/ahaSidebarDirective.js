'use strict';

require('app')
  .directive('ahaSidebarDirective', ahaSidebarDirective);

/**
 * @ngInject
 */
function ahaSidebarDirective(

) {
  return {
    restrict: 'A',
    templateUrl: 'ahaSidebarView',
    controller: 'AhaSidebarController',
    controllerAs: 'ASC'
  };
}
