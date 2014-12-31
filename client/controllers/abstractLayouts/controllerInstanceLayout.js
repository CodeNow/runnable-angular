require('app')
  .controller('ControllerInstanceLayout', ControllerInstanceLayout);
/**
 * @ngInject
 */
function ControllerInstanceLayout(
  configLogoutURL,
  fetchUser,
  fetchInstances,
  $stateParams,
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
    if (err) { return errs.handler(err); }
    thisUser = user;
    resolveInstanceFetch(
      $stateParams.userName
    );
  });

  function resolveInstanceFetch(username) {
    if (!username) { return; }
    async.waterfall([
      function (cb) {
        $rootScope.dataApp.state.loadingInstances = true;
        $rootScope.dataApp.data.instances = null;
        $rootScope.safeApply(cb);
      },
      function (cb) {
        fetchInstances(username, true, cb);
      },
      function (instances, queriedUsername, cb) {
        if (username === keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()')) {
          $rootScope.dataApp.data.instances = instances;
          $rootScope.dataApp.state.loadingInstances = false;
          $rootScope.safeApply(cb);
        } else {
          cb();
        }
      }
    ], errs.handler);
  }

  var instanceListUnwatcher = $scope.$on('INSTANCE_LIST_FETCH', function(event, username) {
    resolveInstanceFetch(username);
  });

  $scope.$on('$destroy', function () {
    instanceListUnwatcher();
  });

}
