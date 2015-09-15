'use strict';

require('app')
  .directive('serverCard', function serverCard(
    $q,
    $rootScope,
    errs,
    keypather,
    parseDockerfileForCardInfoFromInstance,
    promisify,
    helpCards,
    fetchStackAnalysis,
    createServerObjectFromInstance,
    $state,
    $document
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
      link: function ($scope, ele) {
        var listeners = [];

        $scope.getContainerFilesDisplay = function () {
          var repos = 0;
          var files = 0;
          var keys = 0;
          $scope.server.containerFiles = $scope.server.containerFiles || [];
          $scope.server.containerFiles.forEach(function (containerFile) {
            if (containerFile.type === 'Repository') {
              repos += 1;
            } else if (containerFile.type === 'File') {
              files += 1;
            } else if (containerFile.type === 'SSH Key') {
              keys += 1;
            }
          });
          var messages = [];
          if (repos === 1) {
            messages.push('1 Repository');
          } else if (repos) {
            messages.push(repos + ' Repositories');
          }
          if (files === 1) {
            messages.push('1 File');
          } else if (files) {
            messages.push(files + ' Files');
          }
          if (keys === 1) {
            messages.push('1 Key');
          } else if (keys) {
            messages.push(keys + ' Keys');
          }

          if(messages.length){
            return messages.join(', ');
          }
          return '—';

        };
        $scope.helpCards = helpCards;
        $scope.server = {};
        $scope.activeAccount = $rootScope.dataApp.data.activeAccount;

        function scrollIntoView(){
          $document.scrollToElement(ele, 100, 200);
        }

        function handleNewInstance(instance) {
          // This may be a newInstance... just a placeholder
          helpCards.removeByInstance(instance);
          angular.extend($scope.server, createServerObjectFromInstance(instance));

          if (!instance.contextVersion) { return; }
          $scope.server.building = true;

          return promisify(instance, 'fetchDependencies', true)()
            .then(function (dependencies) {
              $scope.server.building = false;

              var fullRepoName = keypather.get($scope.server.instance, 'contextVersion.getMainAppCodeVersion().attrs.repo');
              if (fullRepoName) {
                fetchStackAnalysis(fullRepoName)
                .then(function (stackAnalysis) {
                  if (!stackAnalysis.serviceDependencies) { return; }

                  var calculateHelpCards = function () {
                    // This may be a newInstance... just a placeholder
                    helpCards.removeByInstance(instance);

                    stackAnalysis.serviceDependencies.forEach(function (dependency) {
                      var matchedInstance = $scope.data.instances.find(function (instance) {
                        return instance.attrs.lowerName === dependency;
                      });

                      if (matchedInstance) {
                        var matchedDependency = dependencies.find(function (dep) {
                          return dep.attrs.shortHash === matchedInstance.attrs.shortHash;
                        });

                        if (matchedDependency) { return; }
                        if (instance.attrs.owner.username !== $state.params.userName) {
                          return;
                        }
                        helpCards.triggerCard('missingAssociation', {
                          instance: $scope.server.instance,
                          association: matchedInstance.attrs.name
                        })
                          .then(function (helpCard) {
                            if (!helpCard) { return; }
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
                            }).catch(errs.handler);
                      } else {
                        if (instance.attrs.owner.username !== $state.params.userName) {
                          return;
                        }
                        helpCards.triggerCard('missingDependency', {
                          instance: $scope.server.instance,
                          dependency: dependency
                        })
                          .then(function (helpCard) {
                            if (!helpCard) { return; }
                            listeners.push({
                              obj: helpCard,
                              key: 'refresh',
                              value: calculateHelpCards
                            });
                            helpCard
                              .on('refresh', calculateHelpCards);
                          }).catch(errs.handler);
                        }
                      });
                    };
                    calculateHelpCards();
                  }).catch(errs.handler);
                } else {
                  var calculateHelpCards = function () {
                    var instancePromises = $scope.data.instances
                      .filter(function (instance) {
                        return instance !== $scope.server.instance;
                      })
                      .map(function (instance) {
                        if (keypather.get(instance, 'dependencies.models.length')) {
                          return $q.when(instance.dependencies);
                        }
                        if (keypather.get(instance, 'attrs._id')) {
                          return promisify(instance, 'fetchDependencies')();
                        }
                        return [];
                      });
                    $q.all(instancePromises)
                      .then(function (dependencyList) {
                        return dependencyList.find(function (depList) {
                          return depList.find(function (dep) {
                            return dep.attrs.name === $scope.server.instance.attrs.name;
                          });
                        });
                      })
                      .then(function (foundMatch) {
                        if (!foundMatch) {
                          var foundInstanceWithMainACV = $scope.data.instances.find(function (instance) {
                            return keypather.get(instance, 'contextVersion.getMainAppCodeVersion()');
                          });
                          if (!foundInstanceWithMainACV) {
                            return;
                          }

                          if (instance.attrs.owner.username !== $state.params.userName) {
                            return;
                          }
                          helpCards.triggerCard('missingMapping', {
                            mapping: $scope.server.instance.attrs.name
                        })
                          .then(function (helpCard) {
                            if (!helpCard) { return; }
                            listeners.push({
                              obj: helpCard,
                              key: 'refresh',
                              value: calculateHelpCards
                            });
                            helpCard
                              .on('refresh', calculateHelpCards);
                          })
                          .catch(errs.handler);
                      }
                    });
                };

                calculateHelpCards();
              }
            })
            .catch(errs.handler);
        }

        $scope.$watchCollection('instance.attrs', function (n) {
          if (n) {
            handleNewInstance($scope.instance);
          }
        });

        $scope.$watch('instance.contextVersion.attrs.infraCodeVersion', function (n) {
          if (n && !keypather.get($scope, 'instance.contextVersion.attrs.advanced')) {
            $scope.server.parsing = true;
            return parseDockerfileForCardInfoFromInstance($scope.instance)
              .then(function (data) {
                if (data) {
                  Object.keys(data).forEach(function (key) {
                    $scope.server[key] = data[key];
                  });
                }
              })
              .catch(errs.handler)
              .finally(function () {
                $scope.server.parsing = false;
              });
          }
        });

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
          return '—';
        };
        $scope.showSpinner = function () {
          return !$scope.server.build || $scope.server.building || $scope.server.parsing;
        };
        $scope.getTranslationDisplay = function () {
          var ruleObject = keypather.get(
            $scope,
            'server.contextVersion.getMainAppCodeVersion().attrs.transformRules'
          );
          var total = 0;
          if (ruleObject) {
            total = ruleObject.replace.length + ruleObject.rename.length;
          }
          var result = (!total ? '—' : total + ' rule') + (total > 1 ? 's' : '');
          if (keypather.get(ruleObject, 'exclude.length')) {
            result += ' (' + ruleObject.exclude.length + ' files ignored)';
          }
          return result;
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
