require('app')
  .directive('modalForkBox', modalForkBox);
/**
 * directive modalForkBox
 * @ngInject
 */
function modalForkBox(
  QueryAssist,
  $stateParams,
  $rootScope,
  async,
  user,
  $log
) {
  return {
    restrict: 'E',
    templateUrl: 'viewModalForkBox',
    replace: true,
    scope: {
      data: '=',
      actions: '=',
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {
      $scope.data.newForkName = $scope.data.instance.attrs.name + '-copy';
      $scope.data.forkDependencies = true;

      // This is to fetch the list of instances for validation
      function fetchUser(cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {
            $scope.user = user;
            cb();
          })
          .go();
      }
      function fetchInstanceList(cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchInstances', cb)
          .query({
            githubUsername: $stateParams.userName
          })
          .cacheFetch(function (instances, cached, cb) {
            if (!cached && instances.models.length === 0) {
              throw new Error('instance not found');
            }
            $scope.data.instances = instances;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, projects, cb) {
            if (err) { return $log.error(err); }
            cb();
          })
          .go();
      }

      async.series([
        fetchUser,
        fetchInstanceList
      ]);
    }
  };
}