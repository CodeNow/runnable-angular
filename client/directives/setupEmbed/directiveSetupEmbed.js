require('app')
  .directive('runnableSetupEmbed', RunnableSetupEmbed);
/**
 * @ngInject
 */
function RunnableSetupEmbed(
  async,
  QueryAssist,
  $rootScope,
  $state,
  $stateParams,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewSetupEmbed',
    replace: true,
    scope: {},
    link: function($scope, elem, attrs) {

      async.waterfall([
        fetchUser,
        fetchBuild
      ]);

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
            if (err) throw err;
            cb();
          })
          .go();
      }

      function fetchBuild(cb) {
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
            $rootScope.safeApply();
            cb();
          })
          .go();
      }

      function fetchSeedContexts(cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchContexts')
          .query({
            isSource: true
          })
          .cacheFetch(function (contexts, cached, cb) {
            $scope.seedContexts = contexts;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, contexts, cb) {
            if (err) throw err;
            cb();
          })
          .go();
      }

    }
  };
}
