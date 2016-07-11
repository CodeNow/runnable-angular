'use strict';

require('app')
  .directive('addDockerfile', addDockerfile);

function addDockerfile(
  $timeout
) {
  return {
    restrict: 'A',
    require: '^mirrorDockerfile',
    templateUrl: 'addDockerfileView',
    scope: {
      branchName: '=',
      fullRepo: '=',
      viewState: '='
    },
    link: function ($scope, elem, attrs, MDC) {
      $scope.addDockerfileFomPath = function (path) {
        MDC.addDockerfileFromPath(path)
          .then(function () {
            $scope.viewState.showAddDockerfile = false;
            // I'm sorry this is here, because it's terrible.  This is so the panel length will update
            // and fix it's height.  I'm pretty sure it's some issue with animated-panel
            return $timeout(angular.noop);
          });
      };
    }
  };
}
