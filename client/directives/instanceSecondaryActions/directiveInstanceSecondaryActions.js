require('app')
  .directive('instanceSecondaryActions', instanceSecondaryActions);
/**
 * @ngInject
 */
function instanceSecondaryActions(
  async,
  helperInstanceActionsModal,
  QueryAssist,
  $rootScope,
  $state,
  $stateParams,
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

      $scope.popoverGearMenu = {
        data: {},
        actions: {}
      };
      $scope.popoverGearMenu.data.show = false;

      $scope.popoverGearMenu.actions.stopInstance = function () {
        modInstance('stop');
      };
      $scope.popoverGearMenu.actions.startInstance = function () {
        modInstance('start');
      };
      // mutate scope, shared-multiple-states properties & logic for actions-modal
      helperInstanceActionsModal($scope);

      $scope.goToEdit = function () {
        var forkedBuild = $scope.instance.build.deepCopy(function (err) {
          if (err) throw err;
          $state.go('instance.instanceEdit', {
            userName: $stateParams.userName,
            instanceName: $stateParams.instanceName,
            buildId: forkedBuild.id()
          });
        });
      };

      function modInstance(action) {
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

      function fetchUser(cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {})
          .go();
      }

      /**
       * use buildId if stateParams.buildId (instance.setup)
       * otherwise fetch instance & build (instance.instance && instance.edit)
       */
      function fetchBuild(cb) {
        if (!$stateParams.buildId) {
          return fetchInstance(cb);
        }
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchBuild')
          .query($stateParams.buildId)
          .cacheFetch(function (build, cached, cb) {
            $scope.build = build;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, build, cb) {
            if (err) throw err;
            cb();
          })
          .go();
      }

      function fetchInstance(cb) {
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
            $scope.build = $scope.instance.build;
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
        fetchBuild
      ]);

    }
  };
}
