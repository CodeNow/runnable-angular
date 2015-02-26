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
  $scope,
  $state
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

  function sortInstancesByCreator (instances) {
    var sortedInstances = {};
    instances.forEach(function(instance) {
      console.log(instance.attrs.createdBy.github, $state.params);
      // FIXME: Waiting on Bryan
      var username = instance.attrs.createdBy.github === 1616464 ? 'me' : instance.attrs.createdBy.github;
      // var username = instance.attrs.createdBy.github === $state.params.userName ? 'me' : instance.attrs.createdBy.github;
      if (!sortedInstances[username]) {
        sortedInstances[username] = angular.copy(instance.attrs.createdBy);
        sortedInstances[username].instances = [];
      }
      sortedInstances[username].instances.push(instance);
    });
    console.log(sortedInstances);
    return sortedInstances;
  }

  function resolveInstanceFetch(username) {
    if (!username) { return; }
    keypather.set($rootScope, 'dataApp.state.loadingInstances', true);
    keypather.set($rootScope, 'dataApp.data.instances', null);
    fetchInstances({
      githubUsername: username
    }).then(function (instances) {
      $scope.dataApp.data.sortedInstances = sortInstancesByCreator(instances);
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
