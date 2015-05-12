'use strict';

require('app')
  .controller('ControllerInstanceLayout', ControllerInstanceLayout);
/**
 * @ngInject
 */
function ControllerInstanceLayout(
  configLogoutURL,
  $rootScope,
  keypather,
  $scope,
  errs,
  fetchUser,
  fetchInstancesByPod,
  loading
) {

  var currentUser;
  fetchUser().then(function(user) {
    currentUser = user;
  });

  var dataInstanceLayout = $scope.dataInstanceLayout = {
    data: {},
    state: {},
    actions: {}
  };
  dataInstanceLayout.data.logoutURL = configLogoutURL();
  var unwatch = $scope.$watch('dataApp.data.activeAccount.oauthName()', function (n) {
    if (!n) { return; }
    unwatch();
    resolveInstanceFetch(n);
  });

  function resolveInstanceFetch(username) {
    if (!username) { return; }
    loading('sidebar', true);
    keypather.set($rootScope, 'dataApp.data.instancesByPod', null);

    fetchInstancesByPod(username)
      .then(function (instancesByPod) {
        loading('sidebar', false);
        if (instancesByPod.githubUsername === keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()')) {
          $rootScope.dataApp.data.instancesByPod = instancesByPod;
        }
      })
      .catch(errs.handler);
  }

  var instanceListUnwatcher = $scope.$on('INSTANCE_LIST_FETCH', function (event, username) {
    resolveInstanceFetch(username);
  });

  $scope.$on('$destroy', function () {
    instanceListUnwatcher();
  });

}
