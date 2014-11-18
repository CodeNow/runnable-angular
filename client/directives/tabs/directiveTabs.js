require('app')
  .directive('tabs', tabs);
/**
 * tabs Directive
 * @ngInject
 */
function tabs(
  async,
  helperFetchInstanceDeployStatus,
  $rootScope,
  $state,
  $stateParams,
  QueryAssist,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewTabs',
    replace: true,
    scope: {
      openItems: '='
    },
    link: function ($scope, element, attrs) {
      $scope.state = $state;
      var actions = $scope.actions = {};
      var data = $scope.data = {};

      // Redirect to /new if this build has already been built
      function fetchUser(cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            data.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {
            if (err) throw err;
            cb();
          })
          .go();
      }

      function fetchInstance(cb) {
        new QueryAssist(data.user, cb)
          .wrapFunc('fetchInstances')
          .query({
            githubUsername: $stateParams.userName,
            name: $stateParams.instanceName
          })
          .cacheFetch(function (instances, cached, cb) {
            var instance = instances.models[0];
            data.instance = instance;
            $rootScope.safeApply();
          })
          .resolve(function (err, instances, cb) {
            if (!instances.models.length) {
              return cb(new Error('Instance not found'));
            }
            if (err) { throw err; }
            var instance = instances.models[0];
            data.instance = instance;
            $rootScope.safeApply();
            cb(null, instance);
          })
          .go();
      }

      if ($state.$current.name === 'instance.instance') {
        // restore previously active tabs
        async.waterfall([
          fetchUser,
          fetchInstance,
          helperFetchInstanceDeployStatus
        ], function(err) {
          if (err) { throw err; }
          // don't restore tabs if box not running
          if (!data.instance.containers.models[0].running()) {
            return;
          }
          $scope.openItems.restoreTabs(data.instance.id() + '-' + data.instance.build.id(),
                                       data.instance.containers.models[0]);
          $scope.openItems.restoreActiveTab();
        });
      }

    }
  };
}
