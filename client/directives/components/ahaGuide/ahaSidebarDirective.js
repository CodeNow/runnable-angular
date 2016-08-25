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
    controllerAs: 'ASA',
    link: function ($scope, elem, attrs) {
      console.log($scope, elem, attrs);
    }
  };
}
