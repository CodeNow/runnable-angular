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
    watchOncePromise
  ) {
    return {
      restrict: 'A',
      templateUrl: 'viewFormRepository',
      scope: {
        loadingPromisesTarget: '@?',
        ngShow: '&',
        SMC: '=smc',
        state: '=',
        startCommandCanDisable: '=?'
      },
      link: function ($scope, element, attrs) {
        $scope.data = { };
        watchOncePromise($scope, 'state.containerFiles', true)
          .then(function (containerFiles) {
            $scope.state.mainRepoContainerFile = containerFiles.find(function (containerFile) {
              return containerFile.type === 'Main Repository';
            });
            $scope.state.mainRepoContainerFile.commands = $scope.state.mainRepoContainerFile.commands || [];
            // Clear out the start command (only in setup, but this will change)
            if ($scope.startCommandCanDisable && $scope.state.mainRepoContainerFile) {
              $scope.$watch('state.selectedStack.key', function (newStackKey, oldStackKey) {
                var mainRepoContainerFile = $scope.state.mainRepoContainerFile;
                var commandsPopulated = (Array.isArray(mainRepoContainerFile.commands) && mainRepoContainerFile.commands.length > 0);
                if (newStackKey && (newStackKey !== oldStackKey || !commandsPopulated)) {
                  delete $scope.state.startCommand;
                  $scope.state.mainRepoContainerFile.commands = [];
                  var repoName = keypather.get($scope, 'state.acv.attrs.repo.split("/")[1]')|| '';
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
      }
    };
  });
