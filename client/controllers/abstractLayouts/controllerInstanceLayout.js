'use strict';

require('app')
  .controller('ControllerInstanceLayout', ControllerInstanceLayout);
/**
 * @ngInject
 */
function ControllerInstanceLayout(
  configLogoutURL,
  fetchInstances,
  $rootScope,
  keypather,
  $scope
) {

  var dataInstanceLayout = $scope.dataInstanceLayout = {
    data: {},
    state: {},
    actions: {}
  };
  dataInstanceLayout.data.logoutURL = configLogoutURL();
  var unwatch = $rootScope.$watch('dataApp.data.activeAccount.oauthName()', function (n) {
    if (!n) { return; }
    unwatch();
    resolveInstanceFetch(n);
  });

  function resolveInstanceFetch(username) {
    if (!username) { return; }
    keypather.set($rootScope, 'dataApp.state.loadingInstances', true);
    keypather.set($rootScope, 'dataApp.data.instances', null);
    fetchInstances({
      githubUsername: username
    }).then(function (instances) {
      if (instances.githubUsername === keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()')) {
        keypather.set($rootScope, 'dataApp.state.loadingInstances', false);
        keypather.set($rootScope, 'dataApp.data.instances', instances);
      }
    });
  }

  var instanceListUnwatcher = $scope.$on('INSTANCE_LIST_FETCH', function (event, username) {
    resolveInstanceFetch(username);
  });

  $scope.$on('$destroy', function () {
    instanceListUnwatcher();
  });

}
