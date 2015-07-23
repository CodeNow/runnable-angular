'use strict';

require('app')
  .directive('repositoryForm', function repositoryForm() {
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
        $scope.state.commands = $scope.state.commands || [];
        $scope.state.commandRows = 3;
        $scope.data = {
          cacheCommand: $scope.state.commands.some(function (cmd) { return cmd.cache; })
        };

        $scope.$watch('state.commands.length', function () {
          var len = $scope.state.commands.length;
          if (len < 3) {
            len = 3;
          }
          $scope.state.commandRows = len;
        });

        $scope.actions = {
          updateCache: function (cmd) {
            if (cmd && cmd.body.length === 0) {
              return;
            }

            // There's probably a better way to do this
            // Cache needs to be unique
            $scope.state.commands.forEach(function (command) {
              command.cache = false;
            });
            if (cmd) {
              cmd.cache = true;
            }
          },
          toggleCache: function () {
            if (!$scope.data.cacheCommand) {
              $scope.actions.updateCache();
            } else if ($scope.state.commands.length > 0) {
              var command = $scope.state.commands.find(function (command) {
                return command.body.length > 0;
              });
              if (command) {
                command.cache = true;
              }
            }
          }
        };

        // If any of the text is edited, disable cache
        $scope.$watch(function () {
          return $scope.state.commands.map(function (cmd) {
            return cmd.body;
          }).join('\n');
        }, function (n, o) {
          if (n !== o) {
            $scope.data.cacheCommand = false;
          }
        }, true);

        // Clear out the start command (only in setup, but this will change)
        if ($scope.startCommandCanDisable) {
          $scope.$watch('state.selectedStack.key', function (newStackKey, oldStackKey) {
            if (newStackKey && newStackKey !== oldStackKey) {
              delete $scope.state.startCommand;
            }
          });
        }
      }
    };
  });
