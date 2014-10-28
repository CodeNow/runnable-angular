require('app')
  .directive('runnableInstanceEditSecondaryActions', RunnableInstanceEditSecondaryActions);
/**
 * @ngInject
 */
function RunnableInstanceEditSecondaryActions (
  async,
  helperInstanceActionsModal,
  keypather,
  QueryAssist,
  $rootScope,
  $stateParams,
  $timeout,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceEditSecondaryActions',
    replace: true,
    scope: {
      saving: '=',
      openItems: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.popoverGearMenu = {data:{}, actions:{}};
      $scope.popoverGearMenu.data.show = false;
      // mutate scope, shared-multiple-states properties & logic for actions-modal
      helperInstanceActionsModal($scope);

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
            $scope.instance = instances.models[0];
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, projects, cb) {
            if (err) throw err;
          })
          .go();
      }

      function fetchNewBuild (cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchBuild')
          .query($stateParams.buildId)
          .cacheFetch(function (build, cached, cb) {
            $scope.newBuild = build;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, build, cb) {
            if (err) throw err;
            cb();
          })
          .go();
      }

      async.series([
        fetchUser,
        fetchInstance,
        fetchNewBuild
      ]);

    }
  };
}
