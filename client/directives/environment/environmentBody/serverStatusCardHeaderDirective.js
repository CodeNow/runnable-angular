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
      var unwatch = $scope.$watch('server', function (n) {
        if (n) {
          unwatch();
          $scope.popoverServerData.server = n;
        }
      });
      $scope.popoverServerData = {
        server: $scope.server,
        parentData: $scope.data,
        parentState: $scope.state
      };
      if (attrs.popoverTemplate) {
        $scope.popoverTemplate = attrs.popoverTemplate;
      }
    }
  };
}
