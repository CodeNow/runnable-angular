'use strict';

require('app')
  .controller('ControllerInstances', ControllerInstances);
/**
 * @ngInject
 */
function ControllerInstances(
  $filter,
  $localStorage,
  $state,
  keypather,
  setLastOrg,
  errs,
  ModalService,
  fetchInstancesByPod,
  activeAccount,
  user
) {
  var self = this;
  var userName = $state.params.userName;
  self.searchBranches = ""
  self.$storage = $localStorage.$default({
    instanceListIsClosed: false
  });
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

  this.getFilteredInstanceList = function () {
    if (!self.instancesByPod) {
      return null;
    }
    if (self.searchBranches.length === 0) {
      return self.instancesByPod;
    }
    return self.instancesByPod
      .filter(function (masterPod) {
        return (masterPod.getBranchName() ? masterPod.getBranchName().toLowerCase().indexOf(self.searchBranches.toLowerCase()) !== -1 : 0) || masterPod.attrs.name.toLowerCase().indexOf(self.searchBranches.toLowerCase()) !== -1 || self.getFilteredChildren(masterPod).length > 0;
      });
  };

  this.getFilteredChildren = function (masterPod) {
    return masterPod.children.models.filter(function (child) {
      return child.attrs.name.toLowerCase().indexOf(self.searchBranches.toLowerCase()) !== -1;
    });
  };

  this.editInstance = function (instance) {
    ModalService.showModal({
      controller: 'EditServerModalController',
      controllerAs: 'SMC',
      templateUrl: 'editServerModalView',
      inputs: {
        tab: keypather.get(instance, 'contextVersion.attrs.advanced') ? 'env' : 'repository',
        instance: instance,
        actions: {}
      }
    })
      .catch(errs.handler);
  };

  this.openInviteAdminModal = function (instance) {
    ModalService.showModal({
      controller: 'InviteAdminModalController',
      controllerAs: 'IAMC',
      templateUrl: 'inviteAdminModalView',
      inputs: {
        instance: instance,
        isFromAutoDeploy: false
      }
    })
      .catch(errs.handler);
  };

  this.openEnableBranchesModal = function (instance) {
    ModalService.showModal({
      controller: 'EnableBranchesModalController',
      controllerAs: 'EBMC',
      templateUrl: 'enableBranchesModalView',
      inputs: {
        instance: instance
      }
    })
      .catch(errs.handler);
  };
}
