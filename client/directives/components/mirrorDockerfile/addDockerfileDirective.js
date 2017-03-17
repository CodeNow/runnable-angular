'use strict';

require('app')
  .directive('addDockerfile', addDockerfile);

function addDockerfile(
  $q,
  $timeout,
  doesDockerfileExist,
  fetchRepoDockerfile,
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
        $scope.fileName = 'docker-compose.yml';
        $scope.fileLabel = 'Compose file';
        $scope.formLabel = 'Compose File Path';
        loadDefaultDockerfile($scope.fullRepo, $scope.branchName, '/docker-compose.yml');
      } else if ($scope.fileType === 'Docker Compose Test') {
        $scope.fileName = 'compose-test.yml';
        $scope.fileLabel = 'Compose file';
        $scope.formLabel = 'Compose File Path';
      } else if ($scope.fileType === 'Dockerfile') {
        $scope.fileName = 'Dockerfile';
        $scope.fileLabel = 'Dockerfile';
        $scope.formLabel = 'Dockerfile Path';
        loadDefaultDockerfile($scope.fullRepo, $scope.branchName, '/Dockerfile');
      }

      function loadDefaultDockerfile (repo, branchName, filePath) {
        return fetchRepoDockerfile(repo, branchName, filePath)
          .then(doesDockerfileExist)
          .then(function (dockerfile) {
            if (!dockerfile) {
              return $q.reject('file doesn’t exist');
            }
            if ($scope.fileType === 'Dockerfile') {
              MDC.state.dockerComposeFile = null;
              MDC.state.dockerfile = dockerfile;
            } else if ($scope.fileType === 'Docker Compose') {
              MDC.state.dockerComposeFile = dockerfile;
              MDC.state.dockerfile = null;
            }
          });
      }

      $scope.closeDockerFileInput = function () {
        if ($scope.fileType === 'Docker Compose') {
          $scope.viewState.showAddDockerComposeFile = false;
          return;
        }
        $scope.viewState.showAddDockerfile = false;
      };
      $scope.$on('dockerfileExistsValidator::valid', function ($event, path, fileType, dockerfile) {
        if (fileType === 'Dockerfile') {
          MDC.state.dockerComposeFile = null;
          MDC.state.dockerfile = dockerfile;
          return;
        }
        MDC.state.dockerfile = null;
        if (fileType === 'Docker Compose Test') {
          var dockerfileContent = parseDockerComposeFile(dockerfile.content);
          MDC.dockerComposeTestServices = Object.keys(dockerfileContent.services).map(function (k) {
            return { name: k };
          });

          MDC.state.dockerComposeTestFile = dockerfile;
          return;
        }
        MDC.state.dockerComposeFile = dockerfile;
      });
    }
  };
}
