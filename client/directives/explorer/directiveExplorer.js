'use strict';

require('app')
  .directive('explorer', explorer);
/**
 * @ngInject
 */
function explorer() {
  return {
    restrict: 'A',
    templateUrl: 'viewExplorer',
    scope: {
      openItems: '=',
      toggleTheme: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.filePopover = {
        data: {
          show: false
        },
        actions: {}
      };
    }
  };
}
