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
  fetchInstancesByPod,
  $rootScope,
  hasKeypaths,
  keypather,
  fetchUser,
  setLastOrg,
  errs
) {
  favico.reset();
  var userName = $stateParams.userName;
  $scope.loading = true;
  var user;
  fetchUser()
    .then(function(_user) {
      // Needed to get actual user name (not just org)
      user = _user;
      return fetchInstancesByPod();
    })
    .then(function (instances) {
      var lastViewedInstance = keypather.get(user, 'attrs.userOptions.uiState.previousLocation.instance');

      var flattenedInstances = [];
      instances.forEach(function (instance) {
        flattenedInstances.push(instance);
        if (instance.children) {
          instance.children.models.forEach(function (childInstance) {
            flattenedInstances.push(childInstance);
          });
        }
      });

      var currentUserOrOrg =
          keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()') || userName;
      if (instances.githubUsername === currentUserOrOrg) {
        $scope.loading = false;
        var name;
        if (lastViewedInstance) {
          var model = flattenedInstances.find(hasKeypaths({'attrs.name': lastViewedInstance}));
          name = keypather.get(model, 'attrs.name');
        }
        if (!name) {
          var models = $filter('orderBy')(instances.models, 'attrs.name');
          name = keypather.get(models, '[0].attrs.name');
        }
        goToInstance(userName, name);
      }
    })
    .catch(errs.handler);
  function goToInstance(username, instanceName) {
    setLastOrg(username);
    if ($state.includes('instance')) {
      if (instanceName) {
        $state.go('instance.instance', {
          instanceName: instanceName,
          userName: username
        }, {location: 'replace'});
      } else {
        $state.go('config.home', {
          userName: username
        }, {location: 'replace'});
      }
    }
  }

}
