'use strict';

require('app')
  .directive('explorer', explorer);
/**
 * @ngInject
 */
function explorer(
  fetch,
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
        fetch('build', $stateParams.buildId)
        .then(function(build) {
          $scope.build = build;
        });
      } else {
        fetch('instance', {
          githubUsername: $stateParams.userName,
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
