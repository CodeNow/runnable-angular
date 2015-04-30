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
  pFetchUser,
  fetchInstancesByPod
) {

  var currentUser;
  pFetchUser().then(function(user) {
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
    keypather.set($rootScope, 'dataApp.state.loadingInstances', true);
    keypather.set($rootScope, 'dataApp.data.instancesByPod', null);

    fetchInstancesByPod(username)
    .then(function (instancesByPod) {
      if (instancesByPod.githubUsername === keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()')) {
        $rootScope.dataApp.data.instancesByPod = instancesByPod;
        keypather.set($rootScope, 'dataApp.state.loadingInstances', false);
      }
    }).catch(errs.handler);
  }

  var instanceListUnwatcher = $scope.$on('INSTANCE_LIST_FETCH', function (event, username) {
    resolveInstanceFetch(username);
  });

  $scope.$on('$destroy', function () {
    instanceListUnwatcher();
  });

}
