'use strict';

require('app')
  .directive('instanceHeader', instanceHeader);
/**
 * @ngInject
 */
function instanceHeader(
  $stateParams,
  $localStorage,
  extractInstancePorts,
  fetchPullRequest,
  loading
) {
  return {
    restrict: 'A',
    templateUrl: 'instanceHeaderView',
    scope: {
      instance: '=',
      openItems: '=',
      saving: '='
    },
    link: function ($scope) {
      $scope.$storage = $localStorage;
      $scope.userName = $stateParams.userName;
      $scope.isLoading = loading;
      $scope.$watch('instance', function (newValue) {
        if (!newValue) {
          return;
        }
        var ports = extractInstancePorts(newValue);
        $scope.defaultPort = '';
        if (ports.length && ports.indexOf('80') === -1) {
          $scope.defaultPort = ':' + ports[0];
        }
      });


    }
  };
}
