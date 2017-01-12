'use strict';

require('app')
  .directive('mirrorDockerfile', mirrorDockerfileDirective);

function mirrorDockerfileDirective(
  keypather,
  loading
) {
  return {
    restrict: 'A',
    templateUrl: 'mirrorDockerfileView',
    controller: 'MirrorDockerfileController',
    controllerAs: 'MDC',
    bindToController: true,
    scope: {
      branchName: '=',
      fromTool: '=?',
      name: '=',
      repo: '=',
      state: '='
    },
    link: function ($scope) {
      loading.reset('mirrorDockerfile');
      $scope.dockerfile = {};
      $scope.viewState = {
        showAddDockerfile: false
      };
      $scope.$watch('MDC.repo.attrs.name', function () {
        $scope.MDC.resetDockerfilePaths();
        $scope.MDC.resetDockerComposeFilePaths();
        loading('mirrorDockerfile', true);
        $scope.MDC.addDockerComposeFileFromPath('docker-compose.yml');
        $scope.MDC.addDockerfileFromPath('Dockerfile')
          .finally(function () {
            loading('mirrorDockerfile', false);
          });
      });
    }
  };
}
