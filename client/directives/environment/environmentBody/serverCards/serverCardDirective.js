'use strict';

require('app')
  .directive('serverCard', serverCard);

function serverCard(
  $q,
  $rootScope,
  getInstanceClasses,
  keypather,
  parseDockerfileForCardInfoFromInstance,
  promisify,
  helpCards,
  fetchStackAnalysis,
  errs,
  $anchorScroll
) {
  return {
    restrict: 'A',
    templateUrl: 'serverCardView',
    scope: {
      data: '=',
      actions: '=',
      instance: '=',
      helpCard: '=?'
    },
    link: function ($scope, elem, attrs) {
      $scope.helpCards = helpCards;
      $scope.server = {};
      $scope.activeAccount = $rootScope.dataApp.data.activeAccount;

      function scrollIntoView(){
        $anchorScroll('server-' + $scope.server.instance.attrs.shortHash);
      }

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
            .then(function (data) {
              if (keypather.get(data, 'dependencies.models.length')) {
                $scope.numberOfDependencies = data.dependencies.models.length + ' associations';
              } else {
                $scope.numberOfDependencies = 'no associations defined';
              }
              $scope.server.building = false;

              var fullRepoName = keypather.get($scope.server.instance, 'contextVersion.appCodeVersions.models[0].attrs.repo');

              if (fullRepoName) {
                fetchStackAnalysis(fullRepoName).then(function (stackAnalysis) {
                  stackAnalysis.serviceDependencies.forEach(function (dependency) {

                    var matchedInstance = $scope.data.instances.models.find(function (instance) {
                      return instance.attrs.lowerName === dependency;
                    });

                    if (matchedInstance) {
                      var matchedDependency = data.dependencies.find(function (dep) {
                        return dep.attrs.shortHash === matchedInstance.attrs.shortHash;
                      });

                      if (!matchedDependency) {
                        helpCards.triggerCard('missingAssociation', {
                          instance: $scope.server.instance,
                          association: matchedInstance.attrs.name
                        })
                          .then(function (helpCard) {
                            helpCard
                              .on('refresh', function () {
                                createServerObjectFromInstance($scope.server.instance);
                              })
                              .on('activate', function () {
                                scrollIntoView();
                              });
                          });

                      }
                    } else {
                      helpCards.triggerCard('missingDependency', {
                        instance: $scope.server.instance,
                        dependency: dependency
                      })
                        .then(function (helpCard) {
                          helpCard
                            .on('refresh', function () {
                              createServerObjectFromInstance($scope.server.instance);
                            });
                        });
                    }
                  });
                })
                  .catch(errs.handler);
              }
            });
        }
      }

      $scope.$watchCollection('instance.attrs', function () {
        if ($scope.instance) {
          createServerObjectFromInstance($scope.instance);
        }
      });

      $scope.$watch('instance.contextVersion.attrs.infraCodeVersion', function (n) {
        if (n && $scope.instance) {
          $scope.server.building = true;
          return parseDockerfileForCardInfoFromInstance($scope.instance, $scope.data.stacks)
            .then(function (data) {
              if (data) {
                $scope.server.selectedStack = data.selectedStack;
                $scope.server.ports = data.ports;
                $scope.server.startCommand = data.startCommand;
              }
              $scope.server.building = false;
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

    }
  };
}
