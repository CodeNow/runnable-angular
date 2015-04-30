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
      var unwatch = $scope.$watch('server', function (n) {
        if (n) {
          unwatch();
          $scope.popOverServerData.server = n;
        }
      });
      $scope.noTouching = (attrs.noTouching === 'true');
    }
  };
}
