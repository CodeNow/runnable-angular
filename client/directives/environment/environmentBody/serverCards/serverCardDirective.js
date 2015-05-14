'use strict';

require('app')
  .directive('serverCard', function serverCard(
    $q,
    $rootScope,
    $timeout,
    errs,
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
      link: function ($scope) {
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
            $scope.server.repo = keypather.get(instance, 'contextVersion.appCodeVersions.models[0].githubRepo');
            var qAll = {
              dependencies: promisify(instance, 'fetchDependencies')()
            };
            if ($scope.server.repo) {
              qAll.branches = promisify($scope.server.repo.branches, 'fetch')();
            }
            return $q.all(qAll)
              .catch(errs.handler)
              .then(function (data) {
                if (keypather.get(data, 'dependencies.models.length')) {
                  if (data.dependencies.models.length === 1) {
                    $scope.dependencyInfo = '1 association';
                  } else {
                    $scope.dependencyInfo = data.dependencies.models.length + ' associations';
                  }
                } else {
                  $scope.dependencyInfo = 'no associations defined';
                }
                $scope.server.building = false;
                $timeout(angular.noop);
              });
          }
        }

        $scope.$watchCollection('instance.attrs', function (n) {
          if (n) {
            createServerObjectFromInstance($scope.instance);
          }
        });

        $scope.$watch('instance.contextVersion.attrs.infraCodeVersion', function (n) {
          if (n) {
            $scope.server.parsing = true;
            return parseDockerfileForCardInfoFromInstance($scope.instance, $scope.data.stacks)
              .then(function (data) {
                if (data) {
                  $scope.server.selectedStack = data.selectedStack;
                  $scope.server.ports = data.ports;
                  $scope.server.startCommand = data.startCommand;
                }
              })
              .catch(errs.handler)
              .finally(function () {
                $scope.server.parsing = false;
                $timeout(angular.noop);
              });
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
        $scope.showSpinner = function () {
          return !$scope.server.build || $scope.server.building || $scope.server.parsing;
        };
      }
    };
  });
