'use strict';

require('app')
  .directive('composeFilePath', composeFilePath);

/**
 * @ngInject
 */
function composeFilePath(
  parseDockerComposeFile
) {
  return {
    restrict: 'A',
    templateUrl: 'composeFilePathView',
    require: '^mirrorDockerfile',
    scope: {
      pathEnabled: '=?',
      type: '@',
      branchName: '=',
      fullRepo: '='
    },
    link: function ($scope, elem, attr, MDC) {
      MDC.state.configurationMethod = 'dockerComposeFile';
      $scope.dockerComposeState = MDC.state;
      $scope.dockerfile = {};

      $scope.$watch(function () {
          return $scope.pathEnabled;
        }, function (isEnabled) {
        if (!isEnabled) {
          if ($scope.type === 'test') {
            MDC.state.dockerComposeTestFile = null;
          }
          if ($scope.type === 'stage') {
            MDC.state.dockerComposeFile = null;
          }
        } else {
          MDC.state.configurationMethod = 'dockerComposeFile';
        }
      })

      $scope.$on('dockerfileExistsValidator::valid', function ($event, path, fileType, dockerfile) {
        $scope.dockerfile = dockerfile;
        if (fileType === 'Dockerfile') {
          MDC.state.dockerComposeFile = null;
          MDC.state.dockerfile = dockerfile;
          return;
        }
        if (fileType === 'Docker Compose Test') {
          var dockerfileContent = parseDockerComposeFile(dockerfile.content);
          $scope.dockerComposeTestServices = Object.keys(dockerfileContent.services).map(function (serviceName) {
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
