'use strict';

require('app')
  .directive('serverCard', serverCard);

function serverCard(
  $rootScope,
  getInstanceClasses,
  keypather,
  parseDockerfileForCardInfoFromInstance,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: 'serverCardView',
    scope: {
      data: '=',
      actions: '=',
      instance: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.server = {};
      $scope.activeAccount = $rootScope.dataApp.data.activeAccount;

      function createServerObjectFromInstance(instance) {
        // This may be a newInstance... just a placeholder
        $scope.server.instance = instance;

        $scope.server.build = instance.build;
        $scope.server.opts = {
          env: instance.attrs.env
        };
        if (instance.contextVersion) {
          $scope.server.building = true;
          $scope.server.contextVersion = instance.contextVersion;

          $scope.server.advanced = keypather.get(instance, 'contextVersion.attrs.advanced');
          parseDockerfileForCardInfoFromInstance(instance, $scope.data.stacks)
            .then(function (parsingResults) {
              $scope.server.selectedStack = parsingResults.selectedStack;
              $scope.server.ports = parsingResults.ports;
              $scope.server.startCommand = parsingResults.startCommand;

              $scope.server.building = false;
            });

          $scope.server.repo = keypather.get(instance, 'contextVersion.appCodeVersions.models[0].githubRepo');
          if ($scope.server.repo) {
            promisify($scope.server.repo.branches, 'fetch')();
          }
        }
      }

      $scope.$watch('instance.contextVersion', function () {
        if ($scope.instance) {
          createServerObjectFromInstance($scope.instance);
        }
      });

      $scope.getInstanceClasses = getInstanceClasses;
      $scope.getFlattenedSelectedStacks = function (selectedStack) {
        if (!selectedStack) {
          return 'none';
        }
        if (selectedStack) {
          var flattened = selectedStack.name + ' v' + selectedStack.selectedVersion;
          if (selectedStack.dependencies) {
            selectedStack.dependencies.forEach(function (dep) {
              flattened += ', ' + $scope.getFlattenedSelectedStacks(dep);
            });
          }
          return flattened;
        }
        return 'None';
      };
    }
  };
}
