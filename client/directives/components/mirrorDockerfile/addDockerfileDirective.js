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
        $scope.fileName = 'docker-compose.yml';
        $scope.fileLabel = 'Compose file';
        $scope.formLabel = 'Compose File Path';
        MDC.loadDefaultDockerfile($scope.fullRepo, $scope.branchName, '/docker-compose.yml', $scope.fileType);
      } else if ($scope.fileType === 'Docker Compose Test') {
        $scope.fileName = 'compose-test.yml';
        $scope.fileLabel = 'Compose file';
        $scope.formLabel = 'Compose File Path';
      } else if ($scope.fileType === 'Dockerfile') {
        $scope.fileName = 'Dockerfile';
        $scope.fileLabel = 'Dockerfile';
        $scope.formLabel = 'Dockerfile Path';
        MDC.loadDefaultDockerfile($scope.fullRepo, $scope.branchName, '/Dockerfile', $scope.fileType);
      }

      $scope.closeDockerFileInput = function () {
        if ($scope.fileType === 'Docker Compose') {
          $scope.viewState.showAddDockerComposeFile = false;
          return;
        }
        $scope.viewState.showAddDockerfile = false;
      };
      
      $scope.$on('dockerfileExistsValidator::valid', function ($event, path, fileType, dockerfile) {
        $scope.dockerfile = dockerfile;
        if (fileType === 'Dockerfile') {
          MDC.state.dockerComposeFile = null;
          MDC.state.dockerfile = dockerfile;
          return;
        }
        if (fileType === 'Docker Compose Test') {
          var dockerfileContent = parseDockerComposeFile(dockerfile.content);
          MDC.dockerComposeTestServices = Object.keys(dockerfileContent.services).map(function (serviceName) {
            return { name: serviceName };
          });

          MDC.state.dockerComposeTestFile = dockerfile;
          return;
        }
        MDC.state.dockerComposeFile = dockerfile;
      });
    }
  };
}
