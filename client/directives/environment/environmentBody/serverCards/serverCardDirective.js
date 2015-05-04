'use strict';

require('app')
  .directive('serverCard', serverCard);

function serverCard(
  $q,
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
          $q.all({
            dependencies: promisify(instance, 'fetchDependencies')(),
            parsing: parseDockerfileForCardInfoFromInstance(instance, $scope.data.stacks)
          })
            .then(function (data) {
              if (keypather.get(data, 'dependencies.models.length')) {
                $scope.numberOfDependencies = data.dependencies.models.length + ' associations';
              } else {
                $scope.numberOfDependencies = 'no associations defined';
              }
              if (data.parsing) {
                $scope.server.selectedStack = data.parsing.selectedStack;
                $scope.server.ports = data.parsing.ports;
                $scope.server.startCommand = data.parsing.startCommand;

                $scope.server.building = false;
              }
              $scope.server.building = false;
            });
          $scope.server.contextVersion = instance.contextVersion;

          $scope.server.advanced = keypather.get(instance, 'contextVersion.attrs.advanced');

          $scope.server.repo = keypather.get(instance, 'contextVersion.appCodeVersions.models[0].githubRepo');
          if ($scope.server.repo) {
            promisify($scope.server.repo.branches, 'fetch')();
          }
        }
      }

      $scope.$watchCollection('instance.attrs', function () {
        if ($scope.instance) {
          createServerObjectFromInstance($scope.instance);
        }
      });

      $scope.getInstanceClasses = getInstanceClasses;
      $scope.getFlattenedSelectedStacks = function (selectedStack) {
        if (selectedStack) {
          var flattened = selectedStack.name + ' v' + selectedStack.selectedVersion;
          if (selectedStack.dependencies) {
            selectedStack.dependencies.forEach(function (dep) {
              flattened += ', ' + $scope.getFlattenedSelectedStacks(dep);
            });
          }
          return flattened;
        }
        return 'none';
      };
    }
  };
}
