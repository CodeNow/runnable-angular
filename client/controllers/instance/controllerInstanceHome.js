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
  keypather,
  pFetchUser
) {
  favico.reset();
  var userName = $stateParams.userName;
  var lastViewedInstance = keypather.get($localStorage, 'lastInstancePerUser.' + userName);
  $scope.loading = true;
  var user;
  pFetchUser()
  .then(function(_user) {
    // Needed to get actual user name (not just org)
    user = _user;
    return fetchInstances();
  }).then(function (instances) {
    var currentUserOrOrg =
        keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()') || userName;
    if (instances.githubUsername === currentUserOrOrg) {
      $scope.loading = false;
      var name;
      if (lastViewedInstance) {
        var model = instances.models.find(hasKeypaths({'attrs.name': lastViewedInstance}));
        name = keypather.get(model, 'attrs.name');
      }
      if (!name) {
        var ownedInstances = instances.models.filter(hasKeypaths({'attrs.createdBy.username': user.oauthName()}));
        var models = $filter('orderBy')(ownedInstances, 'attrs.name');
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
      $state.go('instance.new', {
        userName: username
      }, {location: 'replace'});
    }
  }

}
