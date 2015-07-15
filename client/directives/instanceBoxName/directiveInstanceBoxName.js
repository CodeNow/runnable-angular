'use strict';

require('app')
  .directive('instanceBoxName', instanceBoxName);
/**
 * @ngInject
 */
function instanceBoxName(
  extractInstancePorts,
  $stateParams,
  fetchPullRequest
) {
  return {
    restrict: 'A',
    templateUrl: 'viewInstanceBoxName',
    scope: {
      instance: '='
    },
    link: function ($scope) {
      $scope.userName = $stateParams.userName;
      $scope.$watch('instance', function (newValue) {
        if (!newValue) {
          return;
        }
        var ports = extractInstancePorts(newValue);
        $scope.defaultPort = '';
        if (ports.length && ports.indexOf('80') === -1) {
          $scope.defaultPort = ':' + ports[0];
        }
        fetchPullRequest($scope.instance)
          .then(function (pr) {
            if(pr){
              $scope.pr = pr;
            }
          });
      });


    }
  };
}
