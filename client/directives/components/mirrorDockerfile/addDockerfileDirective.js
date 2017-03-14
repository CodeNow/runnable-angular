'use strict';

require('app')
  .directive('addDockerfile', addDockerfile);

function addDockerfile(
  $q,
  $timeout,
  parseDockerComposeFile
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
        $scope.fileName = 'compose.yml';
        $scope.fileLabel = 'Compose file';
        $scope.formLabel = 'Compose File Path';
      } else if ($scope.fileType === 'Docker Compose Test') {
        $scope.fileName = 'compose-test.yml';
        $scope.fileLabel = 'Compose file';
        $scope.formLabel = 'Compose File Path';
      } else if ($scope.fileType === 'Dockerfile') {
        $scope.fileName = 'Dockerfile';
        $scope.fileLabel = 'Dockerfile';
        $scope.formLabel = 'Dockerfile Path';
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
      $scope.$on('dockerfileExistsValidator::valid', function ($event, path, fileType, dockerfile) {
        var dockerfileContent = parseDockerComposeFile(dockerfile.content);
        $scope.dockerComposeServices = Object.keys(dockerfileContent.services);
        return $scope.addDockerFile(path, fileType);
      });
    }
  };
}
