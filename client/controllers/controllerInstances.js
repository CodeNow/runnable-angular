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
  loading,
  ModalService,
  fetchInstancesByPod,
  fetchOwnerRepos,
  activeAccount,
  user,
  promisify,
  currentOrg
) {
  var self = this;
  var userName = $state.params.userName;
  self.searchBranches = null;
  self.instanceBranches = null;
  self.branchQuery = null;
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

  this.filterMasterInstance = function (masterPod) {
    if (!self.searchBranches) {
      return true;
    }
    var searchQuery = self.searchBranches.toLowerCase();
    var instanceName = masterPod.getRepoAndBranchName() + masterPod.attrs.lowerName;
    return instanceName.toLowerCase().indexOf(searchQuery) !== -1;
  };

  this.getFilteredInstanceList = function () {
    if (!self.instancesByPod) {
      return null;
    }
    if (!self.searchBranches) {
      return self.instancesByPod;
    }
    var searchQuery = self.searchBranches.toLowerCase();
    return self.instancesByPod
      .filter(function (masterPod) {
        var instanceName = masterPod.getRepoAndBranchName() + masterPod.attrs.lowerName;
        return instanceName.toLowerCase().indexOf(searchQuery) !== -1 ||
          self.getFilteredChildren(masterPod).length > 0;
      });
  };

  this.getFilteredChildren = function (masterPod) {
    if (!self.searchBranches) {
      return masterPod.children.models;
    }
    var searchQuery = self.searchBranches.toLowerCase();
    return masterPod.children.models.filter(function (child) {
      return child.attrs.lowerName.indexOf(searchQuery) !== -1;
    });
  };

  this.getFilteredBranches = function() {
    if (!self.branchQuery) {
      return self.instanceBranches;
    }
    var branchName;
    var searchQuery = self.branchQuery.toLowerCase();
    return self.instanceBranches.filter(function (branch) {
      branchName = branch.attrs.name.toLowerCase();
      return branchName.indexOf(searchQuery) !== -1;
    });
  };

  this.shouldShowChild = function (childInstance) {
    if (!self.searchBranches) {
      return true;
    }
    var searchQuery = self.searchBranches.toLowerCase();
    return childInstance.attrs.lowerName.indexOf(searchQuery) !== -1;
  };

  this.shouldShowParent = function (masterPod) {
    if (!self.searchBranches) {
      return true;
    }
    var searchQuery = self.searchBranches.toLowerCase();

    var instanceName = masterPod.getRepoAndBranchName() + masterPod.attrs.lowerName;
    if (instanceName.indexOf(searchQuery) !== -1) {
      return true;
    }

    return !!masterPod.children.models.find(function (child) {
      return child.attrs.lowerName.indexOf(searchQuery) !== -1;
    });
  };

  this.getReposFromInstance = function(instance) {
    var branchName;
    self.instanceBranches = null;
    self.branchQuery = null;
    loading('fetchingBranches', true);
    var childInstances = instance.children.models.reduce(function(childHash, child) {
      branchName = child.getBranchName();
      childHash[branchName] = branchName;
      return childHash;
    }, {});
    return promisify(currentOrg.github, 'fetchRepo')(instance.getRepoName())
      .then(function (repo) {
        return promisify(repo, 'fetchBranches')();
      })
      .then(function (branches) {
        self.instanceBranches = branches.models.filter(function(branch) {
          branchName = keypather.get(branch, 'attrs.name');
          return !childInstances[branchName];
        });
        loading('fetchingBranches', false);
      });
  };

  this.forkBranchFromInstance = function(branch, instance, closePopover) {
    var sha = branch.attrs.commit.sha;
    var loadingName = 'buildingForkedBranch' + branch.attrs.name;
    var index;
    loading(loadingName, true);
    promisify(instance, 'fork')(branch.attrs.name, sha)
      .then(function(result) {
        loading(loadingName, false);
        closePopover();
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
