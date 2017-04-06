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
        $scope.fileName = 'docker-compose.test.yml';
        $scope.fileLabel = 'Compose file';
        $scope.formLabel = 'Compose File Path';
        MDC.state.types.test = true;
      } else if ($scope.fileType === 'Dockerfile') {
        $scope.fileName = 'Dockerfile';
        $scope.fileLabel = 'Dockerfile';
        $scope.formLabel = 'Dockerfile Path';
        MDC.loadDefaultDockerfile($scope.fullRepo, $scope.branchName, '/Dockerfile', $scope.fileType);
      }

      $scope.newDockerfile = $scope.fileName;

      $scope.$on('dockerfileExistsValidator', function ($event, path, fileType, dockerfile) {
        if (fileType === $scope.fileType) {
          $scope.dockerfile = dockerfile;
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
