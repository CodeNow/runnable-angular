require('app')
  .directive('runnableInstanceSecondaryActions', RunnableInstanceSecondaryActions);
/**
 * @ngInject
 */
function RunnableInstanceSecondaryActions (
  async,
  QueryAssist,
  $rootScope,
  $state,
  $stateParams,
  $timeout,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceSecondaryActions',
    replace: true,
    scope: {
      saving: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.saving = false;

      $scope.popoverGearMenu = {data:{}, actions:{}};
      $scope.popoverGearMenu.data.show = false;
      $scope.popoverGearMenu.actions.stopInstance = function () {
        modInstance('stop');
      };
      $scope.popoverGearMenu.actions.startInstance = function () {
        modInstance('start');
      };
      // scope properties for rename modal
      $scope.popoverGearMenu.data.dataModalRename = {
        instance: null,
        instances: null
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

      $scope.goToEdit = function () {
        var forkedBuild = $scope.instance.build.deepCopy(function (err) {
          if (err) throw err;
          $state.go('instance.instanceEdit', {
            userName:     $stateParams.userName,
            instanceName: $stateParams.instanceName,
            buildId:      forkedBuild.id()
          });
        });
      };

      $scope.$watch('instances', function (n) {
        if (n) {
          $scope.popoverGearMenu.data.dataModalRename.instances = n;
        }
      });
      $scope.$watch('instance', function (n) {
        if (n) {
          $scope.popoverGearMenu.data.dataModalRename.instance = n;
        }
      });

      function modInstance (action) {
        $scope.loading = true;
        $scope.popoverGearMenu.data.show = false;
        $scope.instance[action](function (err) {
          if (err) throw err;
          $scope.instance.fetch(function (err) {
            if (err) throw err;
            $scope.loading = false;
            $rootScope.safeApply();
          });
        });
      }

      function fetchUser (cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {
          })
          .go();
      }

      function fetchInstance (cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchInstances', cb)
          .query({
            githubUsername: $stateParams.userName,
            name: $stateParams.instanceName
          })
          .cacheFetch(function (instances, cached, cb) {
            if (!cached && instances.models.length === 0) {
              throw new Error('instance not found');
            }
            $scope.instances = instances;
            $scope.instance = instances.models[0];
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, projects, cb) {
            if (err) throw err;
          })
          .go();
      }

      async.series([
        fetchUser,
        fetchInstance
      ]);

    }
  };
}
