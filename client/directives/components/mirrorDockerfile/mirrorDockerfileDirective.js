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
        showAddDockerfile: false,
        showAddDockerComposeFile: false
      };
      $scope.toggleDockerfileDisplay = function (fileType) {
        if (fileType === 'Docker Compose') {
          $scope.viewState.showAddDockerfile = false;
          $scope.viewState.showAddDockerComposeFile = true;
        } else {
          $scope.viewState.showAddDockerfile = true;
          $scope.viewState.showAddDockerComposeFile = false;
        }
      };
      $scope.$watch('MDC.repo.attrs.name', function () {
        $scope.MDC.resetDockerfilePaths();
      });
    }
  };
}
