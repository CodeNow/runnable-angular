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
    $rootScope.dataApp.state.loadingInstances = true;
    $rootScope.dataApp.data.instances = null;
    fetchInstances({
      githubUsername: username
    }).then(function (instances) {
      if (username === keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()')) {
        $rootScope.dataApp.data.instances = instances;
        $rootScope.dataApp.state.loadingInstances = false;
      }
    });
  }

  var instanceListUnwatcher = $scope.$on('INSTANCE_LIST_FETCH', function(event, username) {
    resolveInstanceFetch(username);
  });

  $scope.$on('$destroy', function () {
    instanceListUnwatcher();
  });

}
