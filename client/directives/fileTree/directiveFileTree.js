require('app')
  .directive('fileTree', fileTree);
/**
 * fileTree Directive
 * @ngInject
 */
function fileTree(
  async,
  QueryAssist,
  $rootScope,
  $state,
  $stateParams,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewFileTree',
    replace: true,
    scope: {
      openItems: '='
    },
    link: function ($scope, element, attrs) {

      var actions = $scope.actions = {};
      var data = $scope.data = {};

      switch($state.$current.name) {
        case 'instance.edit':
          break;
        case 'instance.instance':
          break;
        case 'instance.setup':
          $scope.readOnly = false;
          break;
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
            if (err) throw err;
            cb();
          })
          .go();
      }

      function fetchBuild (cb) {
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

      async.series([
        fetchUser,
        fetchBuild
      ], function (err) {
        if (err) throw err;
        $scope.rootDir = $scope.build.contextVersions.models[0].rootDir;
        $rootScope.safeApply();
      });

      $scope.$watch('rootDir', function (newVal, oldVal) {
        if (newVal) {
          var rootDir = $scope.rootDir;
          rootDir.state = rootDir.state || {};
          rootDir.state.open = true;
        }
      });
    }
  };
}
