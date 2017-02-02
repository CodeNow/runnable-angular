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
      viewState: '=',
      fileType: '@'
    },
    link: function ($scope, elem, attrs, MDC) {
      if ($scope.fileType === 'Docker Compose') {
        $scope.fileName = 'docker-compose.yml';
      } else {
        $scope.fileName = 'Dockerfile';
      }
      $scope.closeDockerFileInput = function () {
        if ($scope.fileType === 'Docker Compose') {
          $scope.viewState.showAddDockerComposeFile = false;
          return;
        }
        $scope.viewState.showAddDockerfile = false;
      };
      $scope.addDockerFile = function (path, fileType) {
        if (fileType === 'Docker Compose') {
          return MDC.addDockerComposeFileFromPath(path)
            .then(function () {
              $scope.viewState.showAddDockerComposeFile = false;
              // I'm sorry this is here, because it's terrible.  This is so the panel length will update
              // and fix it's height.  I'm pretty sure it's some issue with animated-panel
              return $timeout(angular.noop);
            });
        }
        return MDC.addDockerfileFromPath(path)
          .then(function () {
            $scope.viewState.showAddDockerfile = false;
            return $timeout(angular.noop);
          });
      };
    }
  };
}
