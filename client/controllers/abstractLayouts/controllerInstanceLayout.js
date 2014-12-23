require('app')
  .controller('ControllerInstanceLayout', ControllerInstanceLayout);
/**
 * @ngInject
 */
function ControllerInstanceLayout(
  configLogoutURL,
  fetchUser,
  $stateParams,
  QueryAssist,
  errs,
  $rootScope,
  keypather,
  async,
  $scope
) {
  var thisUser;

  var dataInstanceLayout = $scope.dataInstanceLayout = {
    data: {},
    state: {},
    actions: {}
  };
  dataInstanceLayout.data.logoutURL = configLogoutURL();
  fetchUser(function(err, user) {
    if (err) {
      return errs.handler(err);
    }
    thisUser = user;
    fetchInstances(
      $stateParams.userName
    );
  });

  function fetchInstances(account, cb) {
    if (!account) { return; }
    async.series([
      function (cb) {
        $rootScope.dataApp.state.loadingInstances = true;
        $rootScope.dataApp.data.instances = null;
        $rootScope.safeApply(cb);
      },
      function (cb) {
        new QueryAssist(thisUser, cb)
          .wrapFunc('fetchInstances', cb)
          .query({
            githubUsername: account
          })
          .cacheFetch(function (instances, cached, cb) {
            if (account === keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()')) {
              if ($rootScope.dataApp.data.instances !== instances) {
                $rootScope.dataApp.data.instances = instances;
              }
              $rootScope.dataApp.state.loadingInstances = false;
              $rootScope.safeApply(cb);
            } else {
              cb();
            }
          })
          .resolve(function (err, projects, cb) {
            cb(err);
          })
          .go();
      },
      cb
    ], function (err) {
      if (err) { throw err; }
    });
  }

  var instanceListUnwatcher = $scope.$on('INSTANCE_LIST_FETCH', function(event, username) {
    fetchInstances(username);
  });

  $scope.$on('$destroy', function () {
    instanceListUnwatcher();
  });

}
