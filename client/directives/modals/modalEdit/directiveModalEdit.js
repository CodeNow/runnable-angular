'use strict';

require('app')
  .directive('modalEdit', modalEdit);
/**
 * directive modalEdit
 * @ngInject
 */
function modalEdit(
  $state,
  $q,
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
      // Add thing
      $scope.validation = {};
      $scope.tempModel = {};
      $scope.configUserContentDomain = configUserContentDomain;

      var building = false;
      $scope.actions = {
        close: function (cb) {
          // Remove all validation stuff from instance and dockerfile
          if ($scope.data.instance) {
            delete $scope.data.instance.validation;
          }
          if ($scope.dockerfile) {
            delete $scope.dockerfile.validation;
          }
          $scope.defaultActions.close(cb);
        },
        buildServer: function () {
          if ($scope.building) { return; }
          $scope.building = true;
          eventTracking.triggeredBuild(false);
          var unwatch = $scope.$watch(function () {
            return !keypather.get($scope, 'build.state.dirty')  && !$scope.openItems.isClean();
          }, function (n) {
            if (!n) { return; }
            unwatch();
            var buildObj = {
              message: 'Manual build'
            };
            var build = $scope.build;
            var instance = $scope.data.instance;
            var newName = $scope.newName;
            promisify(build, 'build')(buildObj)
              .then(function (build) {
                var opts = {
                  build: build.id()
                };
                if (instance.state && instance.state.env) {
                  opts.env = instance.state.env;
                }
                if (newName) {
                  opts.name = newName;
                }
                return $q.all([promisify(instance, 'update')(opts),
                  function () {
                    var defer = $q.defer();
                    $scope.actions.close(function () {
                      defer.resolve();
                    });
                    return defer.promise;
                  }]);
              })
              .then(function () {
                $state.go('instance.instance', {
                  instanceName: newName
                });
              })
              .catch(function (err) {
                errs.handler(err);
                return resetBuild();
              })
              .finally(function () {
                $scope.building = false;
              });
          });
        }
      };

      $scope.getAllErrorsCount = function () {
        var envErrors = keypather.get($scope, 'data.instance.validation.envs.errors.length') || 0;
        var dockerFileErrors = keypather.get($scope, 'dockerfile.validation.errors.length') || 0;
        return envErrors + dockerFileErrors;
      };

      if ($scope.data.instance) {
        $scope.data.instance.validation = {
          envs: {}
        };
      }
      $scope.popoverExposeInstruction = {
        data: {
          show: false
        },
        actions: {}
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
        if (!rootDir) { throw new Error('rootDir not found'); }
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

      function resetBuild() {
        return promisify($scope.data.instance.build, 'deepCopy')()
          .then(function (build) {
            $scope.build = build;
            return promisify(build.contextVersions.models[0], 'fetch')();
          });
      }
      $scope.$watch('data.instance', function (n) {
        if (n) {
          resetBuild()
            .then(setDefaultTabs)
            .catch(errs.handler);
        }
      });
    }
  };
}
