'use strict';

require('app')
  .directive('serverStatusCardHeader', serverStatusCardHeader);
/**
 * @ngInject
 */
function serverStatusCardHeader(
) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'serverStatusCardHeaderView',
    link: function ($scope, elem, attrs) {
      $scope.popOverServerData = {
        server: $scope.server,
        parentData: $scope.data,
        parentState: $scope.state
      };
    }
  };
}
