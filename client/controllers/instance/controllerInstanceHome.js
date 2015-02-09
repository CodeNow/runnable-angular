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
  favico,
  fetchInstances,
  $localStorage,
  $rootScope,
  hasKeypaths,
  keypather
) {
  favico.reset();
  var userName = $stateParams.userName;
  var instanceName = keypather.get($localStorage, 'lastInstancePerUser.' + userName);
  $scope.loading = true;
  fetchInstances()
    .then(function (instances) {
      var currentUser =
          keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()') || userName;
      if (instances.githubUsername === currentUser) {
        $scope.loading = false;
        var name;
        if (instanceName) {
          var model = instances.models.find(hasKeypaths({'attrs.name': instanceName}));
          name = keypather.get(model, 'attrs.name');
        }
        if (!name) {
          var models = $filter('orderBy')(instances.models, 'attrs.name');
          name = keypather.get(models, '[0].attrs.name');
        }
        goToInstance(userName, name);
      }
    });
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
