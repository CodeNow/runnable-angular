require('app')
  .factory('helperInstanceActionsModal', HelperInstanceActionsModal);
/**
 * @ngInject
 */
function HelperInstanceActionsModal(
  $rootScope,
  $state,
  $stateParams,
  $timeout
) {
  /**
   * Shared actions-modal logic.
   * Present on instance.instance & instance.instanceEdit
   */
  return function ($scope) {

    var COPY_SUFFIX = '-copy';

    if (!$scope.popoverGearMenu || !$scope.popoverGearMenu.data) {
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
      forkInstance: function (newName, env, cb) {
        $scope.popoverGearMenu.data.show = false;
        $rootScope.dataApp.data.loading = true;
        newName = newName.trim();
        cb = cb || angular.noop;
        // TODO display loading overlay
        var newInstance = $scope.instance.copy(function (err) {
          if (err) throw err;
          var opts = {};
          opts.name = newName;
          if (env) {
            opts.env = env.map(function (e) {
              return e.key + '=' + e.value;
            });
          }
          newInstance.update(opts, function (err) {
            $rootScope.safeApply();
            if (err) throw err;
            // update instances collection to update
            // viewInstanceList
            $state.go('instance.instance', {
              userName: $stateParams.userName,
              instanceName: newInstance.attrs.name
            });
          });
        });
      },
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
