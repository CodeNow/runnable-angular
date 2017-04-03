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
        $scope.fileLabel = 'Compose file';
        $scope.formLabel = 'Compose File Path';
        MDC.state.types.stage = true;
        MDC.loadDefaultDockerfile($scope.fullRepo, $scope.branchName, '/docker-compose.yml', $scope.fileType);
      } else if ($scope.fileType === 'Docker Compose Test') {
        $scope.fileName = 'compose-test.yml';
        $scope.fileLabel = 'Compose file';
        $scope.formLabel = 'Compose File Path';
        MDC.state.types.test = true;
      } else if ($scope.fileType === 'Dockerfile') {
        $scope.fileName = 'Dockerfile';
        $scope.fileLabel = 'Dockerfile';
        $scope.formLabel = 'Dockerfile Path';
        MDC.loadDefaultDockerfile($scope.fullRepo, $scope.branchName, '/Dockerfile', $scope.fileType);
      }

      $scope.$on('dockerfileExistsValidator', function ($event, path, fileType, dockerfile) {
        if (fileType === 'Dockerfile') {
          if (!dockerfile) {
            MDC.state.dockerfile = null;
            $scope.dockerfile = null;
            return;
          }
          MDC.state.dockerComposeFile = null;
          MDC.state.dockerComposeTestFile = null;
          MDC.state.types = {};
          $scope.dockerfile = dockerfile;
          MDC.state.dockerfile = dockerfile;
          return;
        } 
      });

      $scope.closeDockerFileInput = function () {
        if ($scope.fileType === 'Docker Compose') {
          $scope.viewState.showAddDockerComposeFile = false;
          return;
        }
        $scope.viewState.showAddDockerfile = false;
      };
    }
  };
}
