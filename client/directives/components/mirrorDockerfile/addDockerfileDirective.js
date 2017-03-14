'use strict';

require('app')
  .directive('addDockerfile', addDockerfile);

function addDockerfile(
  $q,
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
        return $q.when()
          .then(function () {
            if (fileType === 'Docker Compose') {
              return MDC.addDockerComposeFileFromPath(path);
            }
            return MDC.addDockerfileFromPath(path);
          })
          .then(function (file) {
            $scope.dockerfile = file;
            return $timeout(angular.noop);
          });
      };
      $scope.$on('dockerfileExistsValidator::valid', function ($event, path, fileType) {
        return $scope.addDockerFile(path, fileType);
      });
    }
  };
}
