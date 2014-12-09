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

    var unwatchInstance = $scope.$watch('instance', function (n) {
      if (!n) return;
      data.instance = n;
      // data.newName used in renameInstance popover
      data.newName = n.attrs.name;
      $scope.popoverGearMenu.data.instance = n;
    });

    var unwatchInstances = $scope.$watch('instances', function (n) {
      if (!n) return;
      data.instances = n;
      $scope.popoverGearMenu.data.instances = n;
    });

    var unwatchbuild = $scope.$watch('build', function (n) {
      if (!n) return;
      data.build = n;
      $scope.popoverGearMenu.data.build = n;
    });

    $scope.$on('$destroy', function () {
      unwatchbuild();
      unwatchInstances();
      unwatchInstance();
    });

    $scope.popoverGearMenu.data.dataModalRename = data;
    $scope.popoverGearMenu.data.dataModalFork = data;
    $scope.popoverGearMenu.data.dataModalDelete = data;
    $scope.popoverGearMenu.data.dataModalEnvironment= data;

    $scope.popoverGearMenu.actions.actionsModalEnvironment = {
      save: function (cb) {
        $scope.popoverGearMenu.data.show = false;
        if (cb) {
          cb();
        }
      },
      rebuild: function(opts, cb) {
        $scope.popoverGearMenu.data.show = false;
        $rootScope.dataApp.data.loading = true;
        if (!opts.env) { return; }
        $scope.instance.update(opts, function (err) {
          $rootScope.safeApply();
          if (err) throw err;
          $rootScope.dataApp.data.loading = false;
          // update instances collection to update
          // viewInstanceList
          $state.go('instance.instance', $stateParams);
        });
        if (cb) {
          cb();
        }
      },
      cancel: function() {
        $scope.popoverGearMenu.data.show = false;
      }
    };

    $scope.popoverGearMenu.actions.actionsModalRename = {
      renameInstance: function (newName, cb) {
        $scope.popoverGearMenu.data.show = false;
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
          if (err) { throw err; }
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
        var tempOpts = [{
          instance: $scope.instance,
          name: newName,
          env: $scope.instance.state.env ? $scope.instance.state.env : $scope.instance.attrs.env
        }];
        if (forkDeps && keypather.get($scope, 'instance.dependencies.models.length')) {
          $scope.instance.dependencies.models.forEach(function(instance) {
            tempOpts.push({
              instance: instance,
              name: instance.state.name,
              env: instance.state.env ? instance.state.env : instance.attrs.env
            });
          });
        }
        // TODO display loading overlay
        function fork (opts, cb) {
          var instance = opts.instance;
          delete opts.instance;
          instance.copy(opts, function (err) {
            if (err) { throw err; }
            $rootScope.safeApply();
            // update instances collection to update
            // viewInstanceList
            cb();
          });
        }
        async.each(tempOpts, fork, function (err) {
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
      cancel: function () {
        $scope.popoverGearMenu.data.show = false;
      }
    };

    $scope.popoverGearMenu.actions.actionsModalDelete = {
      deleteInstance: function () {
        var deletedInstanceName = data.instance.attrs.name;
        data.instance.destroy(function (err) {
          $rootScope.safeApply();
          if (err) { throw err; }
          // redirect to next instance or new
          if (data.instances.models.length) {
            // Only change the location if we're still on the page
            // If the user switched to a different instance in between, we shouldn't move
            if ($stateParams.instanceName === deletedInstanceName) {
              $state.go('instance.instance', {
                userName: $stateParams.userName,
                instanceName: data.instances.models[0].attrs.name
              });
            }
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
