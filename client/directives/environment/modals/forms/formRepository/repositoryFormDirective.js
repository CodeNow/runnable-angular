'use strict';

require('app')
  .directive('repositoryForm', function repositoryForm(
    $q,
    errs,
    fetchRepoBranches,
    keypather,
    loadingPromises,
    promisify,
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
        $scope.state.commands = $scope.state.commands || [];
        $scope.data = {
          cacheCommand: $scope.state.commands.some(function (cmd) { return cmd.cache; })
        };
        $scope.branchFetching = true;
        watchOncePromise($scope, 'state.acv', true)
          .then(function () {
            if (!$scope.state.branch) {
              $scope.state.branch = $scope.state.repo.newBranch($scope.state.acv.attrs.branch);
              $scope.state.repo.branches.add($scope.state.branch);
              return promisify($scope.state.branch, 'fetch')();
            }
            return null;
          })
          .then(function (selectedBranch) {
            if (selectedBranch || !keypather.get($scope.state, 'repo.branches.models.length')) {
              return $q(function (resolve, reject) {
                // Don't fetch until the next digest cycle so the fancy select has enough time to draw
                $scope.$evalAsync(function () {
                  return fetchRepoBranches($scope.state.repo)
                    .then(resolve)
                    .catch(reject);
                });
              });
            }
          })
          .catch(errs.handler)
          .finally(function () {
            $scope.branchFetching = false;
          });

        var lastActiveCacheIdx;
        $scope.actions = {
          updateCache: function (cmd) {
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
              $scope.state.commands.some(function (command, idx) {
                if (command.cache) {
                  lastActiveCacheIdx = idx;
                  return true;
                }
              });
              $scope.actions.updateCache();
            } else {
              if (lastActiveCacheIdx && $scope.state.commands[lastActiveCacheIdx]) {
                $scope.state.commands[lastActiveCacheIdx].cache = true;
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

        $scope.$watch('state.branch', function (newBranch, oldBranch) {
          if (newBranch && oldBranch && newBranch.attrs.name !== oldBranch.attrs.name) {
            return watchOncePromise($scope, 'state.acv', true)
              .then(function (mainAcv) {
                var newState = {
                  branch: newBranch.attrs.name,
                  commit: newBranch.attrs.commit.sha
                };
                mainAcv.setState(newState);
                var promise;
                if ($scope.loadingPromisesTarget) {
                  promise = loadingPromises.add(
                    $scope.loadingPromisesTarget,
                    promisify(mainAcv, 'update')
                  );
                } else {
                  promise = promisify(mainAcv, 'update');
                }
                return promise(newState);
              })
              .catch(errs.handler)
              .finally(function () {
                $scope.state.acv.resetState();
              });
          }
        });

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
