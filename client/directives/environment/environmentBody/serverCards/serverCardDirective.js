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
    promisify,
    helpCards,
    fetchStackAnalysis,
    $anchorScroll,
    $location,
    $state
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
      link: function ($scope) {
        var listeners = [];

        $scope.helpCards = helpCards;
        $scope.server = {};
        $scope.activeAccount = $rootScope.dataApp.data.activeAccount;

        function scrollIntoView(){
          $location.hash('server-' + $scope.server.instance.attrs.shortHash);
          $anchorScroll();
        }

        function createServerObjectFromInstance(instance) {
          // This may be a newInstance... just a placeholder
          helpCards.removeByInstance(instance);
          $scope.server.instance = instance;
          $scope.server.build = instance.build;
          $scope.server.opts = {
            env: instance.attrs.env
          };

          if ($state.params.instanceName === $scope.server.instance.attrs.name ){
            scrollIntoView();
          }

          if (instance.contextVersion) {
            $scope.server.building = true;
            $scope.server.contextVersion = instance.contextVersion;
            $scope.server.advanced = keypather.get(instance, 'contextVersion.attrs.advanced');
            $scope.server.repo = keypather.get(instance, 'contextVersion.appCodeVersions.models[0].githubRepo');
            var qAll = {
              dependencies: promisify(instance, 'fetchDependencies', true)()
            };
            if ($scope.server.repo) {
              qAll.branches = promisify($scope.server.repo.branches, 'fetch')();
            }
            return $q.all(qAll)
              .catch(errs.handler)
              .then(function (data) {
                $scope.server.building = false;

                var fullRepoName = keypather.get($scope.server.instance, 'contextVersion.appCodeVersions.models[0].attrs.repo');

                if (fullRepoName) {
                  fetchStackAnalysis(fullRepoName).then(function (stackAnalysis) {
                    if (!stackAnalysis.serviceDependencies) { return; }

                    function calculateHelpCards () {
                      // This may be a newInstance... just a placeholder
                      helpCards.removeByInstance(instance);

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
                                listeners.push({
                                  obj: helpCard,
                                  key: 'refresh',
                                  value: calculateHelpCards
                                });
                                listeners.push({
                                  obj: helpCard,
                                  key: 'activate',
                                  value: scrollIntoView
                                });
                                helpCard
                                  .on('refresh', calculateHelpCards)
                                  .on('activate', scrollIntoView);
                              });

                          }
                        } else {
                          helpCards.triggerCard('missingDependency', {
                            instance: $scope.server.instance,
                            dependency: dependency
                          })
                            .then(function (helpCard) {
                              listeners.push({
                                obj: helpCard,
                                key: 'refresh',
                                value: calculateHelpCards
                              });
                              helpCard
                                .on('refresh', calculateHelpCards);
                            });
                        }
                      });
                    }
                    calculateHelpCards();
                  })
                    .catch(errs.handler);
                }
              });
          }
        }

        $scope.$watchCollection('instance.attrs', function (n) {
          if (n) {
            createServerObjectFromInstance($scope.instance);
          }
        });

        $scope.$watch('instance.contextVersion.attrs.infraCodeVersion', function (n) {
          if (n && !keypather.get($scope, 'instance.contextVersion.attrs.advanced')) {
            $scope.server.parsing = true;
            return parseDockerfileForCardInfoFromInstance($scope.instance, $scope.data.stacks)
              .then(function (data) {
                if (data) {
                  $scope.server.selectedStack = data.selectedStack;
                  $scope.server.ports = data.ports;
                  $scope.server.startCommand = data.startCommand;
                  $scope.server.commands = data.commands;
                }
              })
              .catch(errs.handler)
              .finally(function () {
                $scope.server.parsing = false;
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

        $scope.$on('$destroy', function () {
          listeners.forEach(function (watcher) {
            watcher.obj.removeListener(watcher.key, watcher.value);
          });
          helpCards.removeByInstance($scope.server.instance);
        });
      }
    };
  });
