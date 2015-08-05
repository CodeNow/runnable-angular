'use strict';

require('app')
  .controller('ControllerInstances', ControllerInstances);
/**
 * @ngInject
 */
function ControllerInstances(
  $filter,
  $state,
  keypather,
  setLastOrg,
  errs,

  fetchInstancesByPod,
  activeAccount,
  user
) {
  var self = this;
  var userName = $state.params.userName;
  fetchInstancesByPod()
    .then(function (instancesByPod) {

      // If the state has already changed don't continue with old data. Let the new one execute.
      if (userName !== $state.params.userName) {
        return;
      }
      self.instancesByPod = instancesByPod;
      self.activeAccount = activeAccount;

      var instances = instancesByPod;
      var lastViewedInstance = keypather.get(user, 'attrs.userOptions.uiState.previousLocation.instance');

      function isInstanceMatch (instance, nameMatch) {
        if (instance.destroyed || !instance.id()) {
          return false;
        }
        if (!nameMatch || instance.attrs.name === nameMatch) {
          return instance;
        }
      }

      var targetInstance = null;
      if (lastViewedInstance) {
        targetInstance = instances.find(function (instance) {
          var instanceMatch = isInstanceMatch(instance, lastViewedInstance);
          if (instanceMatch) {
            return instanceMatch;
          }
          if (instance.children) {
            return instance.children.find(function (childInstance) {
              return isInstanceMatch(childInstance, lastViewedInstance);
            });
          }
        });
      }

      if (!targetInstance) {
        targetInstance = $filter('orderBy')(instances, 'attrs.name')
          .find(function (instance) {
            return isInstanceMatch(instance);
          });
      }

      setLastOrg(userName);

      if ($state.current.name !== 'base.instances.instance') {
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
