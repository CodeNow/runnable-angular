'use strict';

require('app')
  .directive('repositoryForm', function repositoryForm(
    cardInfoTypes,
    fetchDockerfileFromSource,
    keypather,
    loadingPromises,
    updateDockerfileFromState,
    parseDockerfileForDefaults,
    report,
    watchOncePromise,
    helpCards
  ) {
    return {
      restrict: 'A',
      templateUrl: 'viewFormRepository',
      scope: {
        state: '=',
        startCommandCanDisable: '=?',
        loadingPromisesTarget: '@?',
        ngShow: '&'
      },
      link: function ($scope, element, attrs) {
        $scope.helpCards = helpCards;
        $scope.data = {
          cacheCommand: false
        };
        function checkForCacheCommand() {
          // Use every because it will short circuit when it finds something that returns false
          $scope.data.cacheCommand = !$scope.state.mainRepoContainerFile.commands.every(function (cmd) {
            return !cmd.cache;
          });
        }
        watchOncePromise($scope, 'state.containerFiles', true)
          .then(function (containerFiles) {
            $scope.state.mainRepoContainerFile = containerFiles.find(function (containerFile) {
              return containerFile.type === 'Main Repository';
            });
            $scope.state.mainRepoContainerFile.commands = $scope.state.mainRepoContainerFile.commands || [];
            checkForCacheCommand();
            // Clear out the start command (only in setup, but this will change)
            if ($scope.startCommandCanDisable && $scope.state.mainRepoContainerFile) {
              $scope.$watch('state.selectedStack.key', function (newStackKey, oldStackKey) {
                var mainRepoContainerFile = $scope.state.mainRepoContainerFile;
                var commandsPopulated = (Array.isArray(mainRepoContainerFile.commands) && mainRepoContainerFile.commands.length > 0);
                if (newStackKey && (newStackKey !== oldStackKey || !commandsPopulated)) {
                  delete $scope.state.startCommand;
                  $scope.state.mainRepoContainerFile.commands = [];
                  var repoName = keypather.get($scope, 'state.opts.name') || '';
                  return fetchDockerfileFromSource(
                    newStackKey
                  )
                    .then(function (dockerfile) {
                      $scope.state.sourceDockerfile = dockerfile;
                      return parseDockerfileForDefaults(dockerfile, ['run', 'dst']);
                    })
                    .then(function (defaults) {
                      $scope.state.mainRepoContainerFile.commands = defaults.run.map(function (run) {
                        return new cardInfoTypes.Command('RUN ' + run);
                      });
                      $scope.state.mainRepoContainerFile.path = (defaults.dst.length ? defaults.dst[0] : repoName).replace('/', '');
                      checkForCacheCommand();
                    })
                    .catch(report.error);
                }
              });
            }
          });

        $scope.hasNoCommands = function () {
          var commands = keypather.get($scope, 'state.mainRepoContainerFile.commands') || [];
          return !commands.find(function (command) {
            return command.body.length;
          });
        };

        $scope.updateDockerfile = function () {
          return loadingPromises.finished($scope.loadingPromisesTarget)
            .then(function () {
              return loadingPromises.add($scope.loadingPromisesTarget, updateDockerfileFromState($scope.state));
            });
        };

        $scope.cacheCommand = function (enableCache) {
          if (arguments.length > 0) {
            if ($scope.data.cacheCommand === enableCache) {
              return;
            }
            if (enableCache) {
              var command = $scope.state.mainRepoContainerFile.commands.find(function (command) {
                return command.body.length > 0;
              });
              if (command) {
                command.cache = true;
              }
            } else {
              $scope.actions.updateCache();
            }
            $scope.data.cacheCommand = enableCache;
            return $scope.updateDockerfile();
          } else {
            return $scope.data.cacheCommand;
          }
        };

        $scope.actions = {
          updateCache: function (cmd) {
            if (cmd && cmd.body.length === 0) {
              return;
            }

            // There's probably a better way to do this
            // Cache needs to be unique
            $scope.state.mainRepoContainerFile.commands.forEach(function (command) {
              command.cache = false;
            });
            if (cmd) {
              cmd.cache = true;
            }
            return $scope.updateDockerfile();
          }
        };
      }
    };
  });
