'use strict';

require('app')
  .controller('ControllerInstances', ControllerInstances);
/**
 * @ngInject
 */
function ControllerInstances(
  $filter,
  $stateParams,
  $state,
  favico,
  keypather,
  setLastOrg,
  errs,

  fetchInstancesByPod,
  activeAccount,
  user
) {
  var self = this;
  var userName = $stateParams.userName;
  fetchInstancesByPod()
    .then(function (instancesByPod) {

      // If the state has already changed don't continue with old data. Let the new one execute.
      if (userName !== $stateParams.userName) {
        return;
      }
      self.instancesByPod = instancesByPod;
      self.activeAccount = activeAccount;

      favico.reset();

      var instances = instancesByPod;
      var lastViewedInstance = keypather.get(user, 'attrs.userOptions.uiState.previousLocation.instance');

      var targetInstance = null;
      if (lastViewedInstance) {
        targetInstance = instances.find(function (instance) {
          if (instance.attrs.name === lastViewedInstance) {
            return instance;
          }
          if (instance.children) {
            return instance.children.models.find(function (childInstance) {
              if (childInstance.attrs.name === lastViewedInstance) {
                return childInstance;
              }
            });
          }
        });
      }

      if (!targetInstance) {
        var models = $filter('orderBy')(instances.models, 'attrs.name');
        targetInstance = keypather.get(models, '[0]');
      }

      setLastOrg(userName);

      if (!$state.includes('instance')) {
        if (targetInstance) {
          $state.go('base.instances.instance', {
            instanceName: keypather.get(targetInstance, 'attrs.name'),
            userName: userName
          }, {location: 'replace'});
        } else {
          $state.go('base.config', {
            userName: userName
          }, {location: 'replace'});
        }
      }
    })
    .catch(errs.handler);
}
