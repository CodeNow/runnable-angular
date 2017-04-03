'use strict';

require('app')
  .directive('composeFilePath', composeFilePath);

/**
 * @ngInject
 */
function composeFilePath(
  parseDockerComposeFile,
  eventTracking
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

      var hasRun = false;

      $scope.$watch(function () {
        return $scope.pathEnabled;
      }, function (isEnabled) {
        if (!hasRun) {
          hasRun = true;
        } else {
          eventTracking.filePathToggled($scope.type,isEnabled);
        }
        if (!isEnabled) {
          if ($scope.type === 'test') {
            MDC.state.dockerComposeTestFile = null;
            $scope.dockerComposeTestServices = null;
            MDC.state.testReporter = null;
            MDC.state.types.test = false;
          }
          if ($scope.type === 'stage') {
            MDC.state.dockerComposeFile = null;
            MDC.state.types.stage = false;
          }
        } else {
          MDC.state.configurationMethod = 'dockerComposeFile';
        }
      });

      $scope.$on('dockerfileExistsValidator', function ($event, path, fileType, dockerfile) {
        $scope.dockerfile = dockerfile;
        if (fileType === 'Docker Compose Test') {
          if (dockerfile) {
            var dockerfileContent = parseDockerComposeFile(dockerfile.content);
            $scope.dockerComposeTestServices = Object.keys(dockerfileContent.services).map(function (serviceName) {
              return { name: serviceName };
            });

            MDC.state.dockerComposeTestFile = dockerfile;
            MDC.state.types.test = true;
            return;
          }
          MDC.state.dockerComposeTestFile = null;
          delete MDC.state.types.test;
        }
        if (fileType === 'Docker Compose') {
          if (dockerfile) {
            MDC.state.dockerComposeFile = dockerfile;
            MDC.state.types.stage = true;
            return;
          }
          MDC.state.dockerComposeFile = null;
          delete MDC.state.types.stage;
        }
      });
    }
  };
}
