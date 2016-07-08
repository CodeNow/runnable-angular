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
      if (!keypather.get($scope.MDC, 'repo.dockerfiles.length')) {
        $scope.MDC.fetchRepoDockerfiles();
      }
    }
  };
}
