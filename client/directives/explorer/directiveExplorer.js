'use strict';

require('app')
  .directive('explorer', explorer);
/**
 * @ngInject
 */
function explorer(
  fetchInstances,
  $stateParams
) {
  return {
    restrict: 'A',
    templateUrl: 'viewExplorer',
    scope: {
      openItems: '=',
      toggleTheme: '='
    },
    link: function ($scope, elem, attrs) {
      if ($stateParams.buildId) {
        // fetch('build', $stateParams.buildId)
        // .then(function(build) {
        //   $scope.build = build;
        // });
      } else {
        fetchInstances({
          name: $stateParams.instanceName
        })
        .then(function(instance) {
          $scope.instance = instance;
          $scope.build = instance.build;
        });
      }
    }
  };
}
