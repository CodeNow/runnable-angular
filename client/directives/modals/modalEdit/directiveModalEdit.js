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
          if (building) { return; }
          building = true;
          eventTracking.triggeredBuild(false);
          $scope.loading = true;
          var unwatch = $scope.$watch('openItems.isClean()', function (n) {
            if (!n) { return; }
            unwatch();
            var buildObj = {
              message: 'Manual build'
            };
            var build = $scope.build;
            unwatch = $scope.$watch(function () {
              return keypather.get(build, 'state.dirty');
            }, function (n) {
              if (n) { return; } //state.dirty === 0 is when everything is clean
              unwatch();
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
                .catch(errs.handler);
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
          instance: $scope.data.instance,
          instances: $scope.data.instances
        },
        actions: {
          pasteDependency: function (otherInstance) {
            var url = otherInstance.containers.models[0].urls(configUserContentDomain)[0];
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

      $scope.pasteLinkedInstance = function (text) {
        $scope.$broadcast('eventPasteLinkedInstance', text);
      };

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
