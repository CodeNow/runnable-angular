'use strict';

require('app')
  .directive('repositoryForm', function repositoryForm(
    cardInfoTypes,
    fetchDockerfileFromSource,
    keypather,
    loadingPromises,
    updateDockerfileFromState,
    parseDockerfileForDefaults,
    reportError,
    watchOncePromise
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
        $scope.data = {
          cacheCommand: false
        };
        watchOncePromise($scope, 'state.containerFiles', true)
          .then(function (containerFiles) {
            $scope.mainRepoContainerFile = containerFiles.find(function (containerFile) {
              return containerFile.type === 'Main Repository';
            });
            $scope.mainRepoContainerFile.commands = $scope.mainRepoContainerFile.commands || [];
            $scope.data.cacheCommand = $scope.mainRepoContainerFile.commands.some(function (cmd) {
              return cmd.cache;
            });
            // Clear out the start command (only in setup, but this will change)
            if ($scope.startCommandCanDisable && $scope.mainRepoContainerFile) {
              $scope.$watch('state.selectedStack.key', function (newStackKey, oldStackKey) {
                if (newStackKey && newStackKey !== oldStackKey) {
                  delete $scope.state.startCommand;
                  $scope.mainRepoContainerFile.commands = [];
                  var repoName = keypather.get($scope, 'state.opts.name') || '';
                  return fetchDockerfileFromSource(
                    newStackKey
                  )
                    .then(function (dockerfile) {
                      $scope.state.sourceDockerfile = dockerfile;
                      return parseDockerfileForDefaults(dockerfile, ['run', 'dst']);
                    })
                    .then(function (defaults) {
                      $scope.mainRepoContainerFile.commands = defaults.run.map(function (run) {
                        return new cardInfoTypes.Command('RUN ' + run);
                      });
                      $scope.mainRepoContainerFile.path = (defaults.dst.length ? defaults.dst[0] : repoName).replace('/', '');
                    })
                    .then($scope.updateDockerfile)
                    .catch(reportError);
                }
              });
            }
          });

        $scope.updateDockerfile = function () {
          return loadingPromises($scope.loadingPromisesTarget, updateDockerfileFromState($scope.state));
        };

        $scope.cacheCommand = function (enableCache) {
          if (arguments.length > 0) {
            if (enableCache) {
              var command = $scope.mainRepoContainerFile.commands.find(function (command) {
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
            $scope.mainRepoContainerFile.commands.forEach(function (command) {
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
