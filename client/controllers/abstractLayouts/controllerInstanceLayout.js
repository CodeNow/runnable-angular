require('app')
  .controller('ControllerInstanceLayout', ControllerInstanceLayout);
/**
 * @ngInject
 */
function ControllerInstanceLayout(
  configLogoutURL,
  fetchUser,
  fetchOrgs,
  $stateParams,
  QueryAssist,
  $state,
  $rootScope,
  keypather,
  async,
  $scope
) {
  var thisUser;
  fetchUser(function(err, user) {
    thisUser = user;
  });

  function fetchInstances(account) {
    async.series([
      function (cb) {
        $scope.dataInstanceLayout.state.loadingInstances = true;
        $rootScope.safeApply(cb);
      },
      function (cb) {
        new QueryAssist(thisUser, cb)
          .wrapFunc('fetchInstances', cb)
          .query({
            githubUsername: account
          })
          .cacheFetch(function (instances, cached, cb) {
            if (account === keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()') &&
                $rootScope.dataApp.data.instances !== instances) {
              $rootScope.dataApp.data.instances = instances;
              $scope.dataInstanceLayout.state.loadingInstances = false;
              $rootScope.safeApply(cb);
            } else {
              cb();
            }
          })
          .resolve(function (err, projects, cb) {
            cb(err);
          })
          .go();
      }
    ], function (err) {
      if (err) { throw err; }
    });
  }

  var dataInstanceLayout = $scope.dataInstanceLayout = {
    data: {},
    state: {},
    actions: {}
  };
  dataInstanceLayout.data.logoutURL = configLogoutURL();

  $rootScope.$watch('dataApp.data.activeAccount.oauthName()', function (n) {
    if (n) {
      fetchInstances(n);
    }
  });

}
