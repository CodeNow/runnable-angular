require('app')
  .factory('helperInstanceActionsModal', HelperInstanceActionsModal);
/**
 * @ngInject
 */
function HelperInstanceActionsModal(
  $rootScope,
  $state,
  $stateParams,
  $timeout,
  async,
  keypather,
  updateEnvName
) {
  /**
   * Shared actions-modal logic.
   * Present on instance.instance & instance.instanceEdit
   */
  return function ($scope) {

    var COPY_SUFFIX = '-copy';

    if (!$scope || !$scope.popoverGearMenu || !$scope.popoverGearMenu.data) {
      throw new Error('helperInstanceActionsModal $scope popoverGearMenu not defined');
    }

    var data = {};
    data.instance = null;
    data.instances = null;

    $scope.$watch('instance', function (n) {
      if (!n) return;
      data.instance = n;
      // data.newName used in renameInstance popover
      data.newName = n.attrs.name;
      data.newForkName = data.newName + COPY_SUFFIX;
      $scope.popoverGearMenu.data.instance = n;
    });

    $scope.$watch('instances', function (n) {
      if (!n) return;
      data.instances = n;
      $scope.popoverGearMenu.data.instances = n;
    });

    $scope.$watch('build', function (n) {
      if (!n) return;
      data.build = n;
      $scope.popoverGearMenu.data.build = n;
    });

    $scope.popoverGearMenu.data.dataModalRename = data;
    $scope.popoverGearMenu.data.dataModalFork = data;
    $scope.popoverGearMenu.data.dataModalDelete = data;
    $scope.popoverGearMenu.data.dataModalEnvironment= data;

    $scope.popoverGearMenu.actions.actionsModalEnvironment = {
      cancel: function() {
      }
    };

    $scope.popoverGearMenu.actions.actionsModalRename = {
      renameInstance: function (newName, cb) {
        $scope.popoverGearMenu.data.show = false;
        newName = newName.trim();
        if (newName === $scope.instance.attrs.name) {
          return;
        }
        cb = cb || angular.noop;
        // hacky, class remove + add
        $timeout(function () {
          $scope.saving = true;
        }, 1);
        $scope.saving = false;
        $scope.instance.update({
          name: newName
        }, function (err) {
          $rootScope.safeApply();
          if (err) throw err;
          $state.go('instance.instance', {
            userName: $stateParams.userName,
            instanceName: $scope.instance.attrs.name
          });
        });
        cb();
      },
      cancel: function () {
        $scope.popoverGearMenu.data.show = false;
      }
    };

    $scope.popoverGearMenu.actions.actionsModalFork = {
      // TODO: check instanceEdit page
      forkInstance: function (newName, forkDeps, cb) {
        $scope.popoverGearMenu.data.show = false;
        $rootScope.dataApp.data.loading = true;
        // TODO display loading overlay
        function fork (instance, cb) {
          var newInstance = instance.copy(function (err) {
            if (err) { throw err; }
            var opts = {};
            opts.name = instance.state.name;
            if (instance.attrs.env) {
              opts.env = instance.attrs.env;
            }
            newInstance.update(opts, function (err) {
              $rootScope.safeApply();
              if (err) { throw err; }
              // update instances collection to update
              // viewInstanceList
              cb();
            });
          });
        }
        async.parallel([
          function (cb) {
            $scope.instance.state.name = newName;
            fork($scope.instance, cb);
          },
          function (cb) {
            if (forkDeps && keypather.get($scope, 'instance.dependencies.models.length')) {
              async.each($scope.instance.dependencies.models, fork, cb);
            } else {
              cb();
            }
          }
        ], function (err) {
          if (err) { throw err; }
          $state.go('instance.instance', {
            userName: $stateParams.userName,
            instanceName: newName
          });
          if (cb) {
            cb();
          }
        });
      },
      watchers: [
        function ($scope) {
          $scope.$watch('data.newForkName', function(n, o) {
            if (!n || !keypather.get($scope, 'data.instance.dependencies.models.length')) { return; }

            $scope.data.instance.dependencies.models.forEach(function(instance) {
              updateEnvName(instance, n, o, $scope.data.instance);
            });
          });
          var depWatch = $scope.$watch('data.instance.dependencies', function(n) {
            if (!n) { return; }
            // Cancel watch, it's served its purpose
            depWatch();
            $scope.data.instance.dependencies.models.forEach(function(instance, idx) {
              updateEnvName(instance, instance.attrs.name + COPY_SUFFIX, instance.attrs.name, $scope.data.instance);
              $scope.$watch('data.instance.dependencies.models[' + idx + '].state.name', function(n, o) {
                updateEnvName(instance, n, o, $scope.data.instance);
              });
            });
          });
        }
      ],
      cancel: function () {
        data.newForkName = data.newName + COPY_SUFFIX;
        $scope.popoverGearMenu.data.show = false;
      }
    };

    $scope.popoverGearMenu.actions.actionsModalDelete = {
      deleteInstance: function () {
        data.instance.destroy(function (err) {
          $rootScope.safeApply();
          if (err) throw err;
          // redirect to next instance or new
          if (data.instances.models.length) {
            $state.go('instance.instance', {
              userName: $stateParams.userName,
              instanceName: data.instances.models[0].attrs.name
            });
          } else {
            $state.go('instance.new', {
              userName: $stateParams.userName
            });
          }
        });
      },
      cancel: function () {
        $scope.popoverGearMenu.data.show = false;
      }
    };

  };
}
