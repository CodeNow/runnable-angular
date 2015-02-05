'use strict';

require('app')
  .controller('ControllerInstanceHome', ControllerInstanceHome);
/**
 * @ngInject
 */
function ControllerInstanceHome(
  $filter,
  $stateParams,
  $state,
  $scope,
  fetchInstances,
  $localStorage,
  $rootScope,
  keypather
) {
  var userName = $stateParams.userName;
  var instanceName = keypather.get($localStorage, 'lastInstancePerUser.' + userName);
  if (!instanceName) {
    $scope.loading = true;
    fetchInstances()
      .then(function (instances) {
        var currentUser =
            keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()') || userName;
        if (instances.githubUsername === currentUser) {
          $scope.loading = false;
          var models = $filter('orderBy')(instances.models, 'attrs.name');
          var name = keypather.get(models, '[0].attrs.name');
          goToInstance(userName, name);
        }
    });
  } else {
    goToInstance(userName, instanceName);
  }
  function goToInstance(username, instanceName) {
    if (instanceName) {
      $state.go('instance.instance', {
        instanceName: instanceName,
        userName: username
      }, {location: 'replace'});
    } else {
      $scope.loading = false;
      keypather.set($scope, 'data.in', true);
    }
  }

}
