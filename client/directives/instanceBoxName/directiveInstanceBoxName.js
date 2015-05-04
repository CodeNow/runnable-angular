'use strict';

require('app')
  .directive('instanceBoxName', instanceBoxName);
/**
 * @ngInject
 */
function instanceBoxName(
  getInstanceAltTitle,
  getInstanceClasses,
  extractInstancePorts
) {
  return {
    restrict: 'A',
    templateUrl: 'viewInstanceBoxName',
    scope: {
      instance: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.getInstanceClasses = getInstanceClasses;

      $scope.getInstanceAltTitle = getInstanceAltTitle;

      $scope.$watch('instance', function (newValue) {
        var ports = extractInstancePorts(newValue);
        $scope.defaultPort = '';
        if (ports.length && ports.indexOf('80') === -1) {
          $scope.defaultPort = ':' + ports[0];
        }
      });
    }
  };
}
