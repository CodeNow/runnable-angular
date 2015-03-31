'use strict';

require('app')
  .directive('modalEdit', modalEdit);
/**
 * directive modalEdit
 * @ngInject
 */
function modalEdit(
  $q,
  $state,
  $timeout,
  configUserContentDomain,
  errs,
  eventTracking,
  keypather,
  OpenItems,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalEdit',
    scope: {
      data: '=',
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {
      $scope.openItems = new OpenItems();

      $scope.validation = {
        env: {}
      };
      $scope.state = {
        env: null
      };
      $scope.actions = {
        close: function (cb) {
          // Remove all validation stuff from instance and dockerfile
          if ($scope.dockerfile) {
            delete $scope.dockerfile.validation;
          }
          return $scope.defaultActions.close(cb);
        },
        buildServer: function (noCache) {
          if ($scope.building) { return; }
          $scope.building = true;
          var unwatch = $scope.$watch(function () {
            return !keypather.get($scope, 'build.state.dirty')  && $scope.openItems.isClean();
          }, function (n) {
            if (!n) { return; }
            unwatch();
            var buildObj = {
              message: 'Manual build',
              noCache: noCache
            };
            var build = $scope.build;
            var instance = $scope.data.instance;
            var opts = {};
            if ($scope.state.env) {
              opts.env = $scope.state.env;
            }
            if ($scope.state.name !== instance.attrs.name) {
              opts.name = $scope.state.name;
            }
            eventTracking.triggeredBuild(false);
            promisify(build, 'build')(buildObj)
              .then(function (build) {
                opts.build = build.id();
                return promisify(instance, 'update')(opts);
              }).then(function () {
                $scope.building = false;
                var defer = $q.defer();
                $scope.actions.close(function () {
                  defer.resolve();
                });
                return defer.promise;
              })
              .then(function () {
                if (opts.name) {
                  // We need a timeout so the modal has enough time to destroy itself before
                  // we reroute
                  $timeout(function () {
                    return $state.go('instance.instance', {
                      instanceName: opts.name
                    });
                  });
                }
              })
              .catch(function (err) {
                errs.handler(err);
                return resetBuild(true)
                  .then(function () {
                    // Trigger the opening of the rootDir in the explorer
                    keypather.set(
                      $scope,
                      'build.contextVersions.models[0].rootDir.state.open',
                      true
                    );
                    $scope.openItems.removeAndReopen($scope.build.contextVersions.models[0]);
                  })
                  .then(function () {
                    $scope.building = false;
                  });
              });
          });
        }
      };

      $scope.getAllErrorsCount = function (withText) {
        var envErrors = keypather.get($scope, 'validation.env.errors.length') || 0;
        var dockerFileErrors = keypather.get($scope, 'dockerfile.validation.errors.length') || 0;

        var result = envErrors + dockerFileErrors;
        if (result > 0 && withText) {
          result += ' error' + ((result > 1) ? 's' : '');
        }
        return result;
      };
      $scope.popoverBuildOptions = {
        data: {},
        actions: {
          noCacheBuild: function () {
            $scope.popoverBuildOptions.data.show = false;
            $scope.actions.buildServer(true);
          }
        }
      };
      $scope.popoverExposeInstruction = {
        data: {
          show: false
        }
      };
      $scope.popoverLinkServers = {
        data: {
          show: false,
          instanceData: $scope.data
        },
        actions: {
          pasteDependency: function (otherInstance) {
            var url = otherInstance.containers.models[0].urls(configUserContentDomain)[0]
              .replace(/https?:\/\//, '')
              .replace(/:\d{0,5}/g, '');
            $scope.$broadcast('eventPasteLinkedInstance', url);
          }
        }
      };

      function setDefaultTabs() {
        var rootDir = keypather.get($scope, 'build.contextVersions.models[0].rootDir');
        if (!rootDir) {
          return $q.reject(new Error('rootDir not found'));
        }
        return promisify(rootDir.contents, 'fetch')()
          .then(function () {
            var file = rootDir.contents.models.find(function (file) {
              return (file.attrs.name === 'Dockerfile');
            });
            if (file) {
              $scope.dockerfile = file;
              $scope.openItems.add(file);
            }
          });
      }

      function resetBuild(retry) {
        var build = retry ? $scope.build : $scope.data.build;
        return promisify(build, 'deepCopy')()
          .then(function (build) {
            $scope.build = build;
            // Fetch the cv so all of the repo info is filled
            return promisify(build.contextVersions.models[0], 'fetch')();
          });
      }

      if (!attrs.setup) {
        var unwatchI = $scope.$watch('data.instance', function (n) {
          if (n) {
            unwatchI();
            keypather.set($scope, 'state.name', n.attrs.name);
          }
        });
      }
      var unwatch = $scope.$watch('data.build', function (n) {
        if (n) {
          unwatch();
          resetBuild()
            .then(setDefaultTabs)
            .catch(errs.handler);
        }
      });
    }
  };
}
