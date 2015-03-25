'use strict';

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
  keypather,
  errs,
  promisify,
  $q,
  $localStorage
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
      if (!n) { return; }
      data.instance = n;
      // data.newName used in renameInstance popover
      data.newName = n.attrs.name;
      data.build = n.build;
      $scope.popoverGearMenu.data.instance = n;
    });

    var unwatchInstances = $scope.$watch('instances', function (n) {
      if (!n) { return; }
      data.instances = n;
      $scope.popoverGearMenu.data.instances = n;
    });

    var unwatchbuild = $scope.$watch('build', function (n) {
      if (!n) { return; }
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
    $scope.popoverGearMenu.data.dataModalEnvironment = data;
    $scope.popoverGearMenu.data.dataModalEdit = data;

    $scope.popoverGearMenu.actions.actionsModalEnvironment = {
      save: function (cb) {
        $scope.popoverGearMenu.data.show = false;
        if (cb) {
          cb();
        }
      },
      rebuild: function (opts, cb) {
        $scope.popoverGearMenu.data.show = false;
        $rootScope.dataApp.data.loading = true;
        if (!opts.env) { return; }
        return promisify($scope.instance, 'update')(
          opts
        ).then(function () {
          return promisify($scope.instance, 'redeploy')();
        }).then(function () {
          $state.go('instance.instance', $stateParams, {reload: true});
        }).catch(
          errs.handler
        ).finally(function () {
          $rootScope.dataApp.data.loading = false;
          cb();
        });
      },
      cancel: function () {
        $scope.popoverGearMenu.data.show = false;
      },
      closePopover: function () {
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
        return promisify($scope.instance, 'update')({
          name: newName
        }).then(function () {
          $state.go('instance.instance', {
            userName: $stateParams.userName,
            instanceName: $scope.instance.attrs.name
          });
        }).catch(
          errs.handler
        ).finally(cb);
      },
      cancel: function () {
        $scope.popoverGearMenu.data.show = false;
      },
      closePopover: function () {
        $scope.popoverGearMenu.data.show = false;
      }
    };

    $scope.popoverGearMenu.actions.actionsModalFork = {
      // TODO: check instanceEdit page
      /**
       *
       * @param items An array of objects containing an instance, and the options to send
       *        during the copy
       *
       *        items: [{ instance: {}, opts: { name, env } }]
       *
       * @param cb
       */
      forkInstance: function (items, cb) {
        $scope.popoverGearMenu.data.show = false;
        $rootScope.dataApp.data.loading = true;

        var parallelFunctions = items.map(function (item) {
          return promisify(item.instance, 'copy')(item.opts);
        });
        return $q.all(
          parallelFunctions
        ).then(function () {
          $state.go('instance.instance', {
            userName: $stateParams.userName,
            instanceName: keypather.get(items[0], 'opts.name')
          });
        }).catch(
          errs.handler
        ).finally(function () {
          $rootScope.dataApp.data.loading = false;
        });
      },
      cancel: function () {
        $scope.popoverGearMenu.data.show = false;
      },
      closePopover: function () {
        $scope.popoverGearMenu.data.show = false;
      }
    };

    $scope.popoverGearMenu.actions.actionsModalDelete = {
      deleteInstance: function (deleteDependencies) {
        var deletedInstanceName = data.instance.attrs.name;
        var deps = keypather.get(data, 'instance.dependencies.models') || [];
        var deleteDepMapPromises = deps.filter(function (dep) {
          return (deleteDependencies && keypather.get(dep, 'state.delete'));
        }).map(function (dep) {
          return promisify(dep, 'destroy')();
        });
        return $q.all(
          deleteDepMapPromises
        ).then(function () {
          return promisify(data.instance, 'destroy')();
        }).then(function () {
          if ($stateParams.instanceName === deletedInstanceName) {
            $state.go('instance.home', {
              userName: $stateParams.userName
            });
          }
        }).catch(function (err) {
          keypather.set(
            $localStorage,
            'lastInstancePerUser.' + $stateParams.userName,
            null
          );
          errs.handler(err);
        });
      },
      cancel: function () {
        $scope.popoverGearMenu.data.show = false;
      },
      closePopover: function () {
        $scope.popoverGearMenu.data.show = false;
      }
    };

  };
}
