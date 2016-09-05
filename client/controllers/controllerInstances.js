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
  ahaGuide,
  keypather,
  setLastOrg,
  errs,
  loading,
  ModalService,
  fetchInstancesByPod,
  activeAccount,
  user,
  promisify,
  currentOrg
) {
  var CIS = this;
  var userName = $state.params.userName;
  CIS.ahaGuide = ahaGuide;
  CIS.currentOrg = currentOrg;
  CIS.searchBranches = null;
  CIS.instanceBranches = null;
  CIS.unbuiltBranches = null;
  CIS.branchQuery = null;
  CIS.$storage = $localStorage.$default({
    instanceListIsClosed: false
  });
  fetchInstancesByPod()
    .then(function (instancesByPod) {

      // If the state has already changed don't continue with old data. Let the new one execute.
      if (userName !== $state.params.userName) {
        return;
      }
      CIS.instancesByPod = instancesByPod;
      CIS.activeAccount = activeAccount;

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
    if (!CIS.searchBranches) {
      return true;
    }
    var searchQuery = CIS.searchBranches.toLowerCase();
    var instanceName = masterPod.getRepoAndBranchName() + masterPod.attrs.lowerName;
    return instanceName.toLowerCase().indexOf(searchQuery) !== -1;
  };

  this.getFilteredInstanceList = function () {
    if (!CIS.instancesByPod) {
      return null;
    }
    if (!CIS.searchBranches) {
      return CIS.instancesByPod;
    }
    var searchQuery = CIS.searchBranches.toLowerCase();
    return CIS.instancesByPod
      .filter(function (masterPod) {
        var instanceName = masterPod.getRepoAndBranchName() + masterPod.attrs.lowerName;
        return instanceName.toLowerCase().indexOf(searchQuery) !== -1 ||
          CIS.getFilteredChildren(masterPod).length > 0;
      });
  };

  this.getFilteredChildren = function (masterPod) {
    if (!CIS.searchBranches) {
      return masterPod.children.models;
    }
    var searchQuery = CIS.searchBranches.toLowerCase();
    return masterPod.children.models.filter(function (child) {
      return child.attrs.lowerName.indexOf(searchQuery) !== -1;
    });
  };

  this.getFilteredBranches = function() {
    if (!CIS.branchQuery) {
      return CIS.instanceBranches;
    }
    var branchName;
    var searchQuery = CIS.branchQuery.toLowerCase();
    return CIS.instanceBranches.filter(function (branch) {
      branchName = branch.attrs.name.toLowerCase();
      return branchName.indexOf(searchQuery) !== -1;
    });
  };

  this.shouldShowChild = function (childInstance) {
    if (!CIS.searchBranches) {
      return true;
    }
    var searchQuery = CIS.searchBranches.toLowerCase();
    return childInstance.attrs.lowerName.indexOf(searchQuery) !== -1;
  };

  this.shouldShowParent = function (masterPod) {
    if (!CIS.searchBranches) {
      return true;
    }
    var searchQuery = CIS.searchBranches.toLowerCase();

    var instanceName = masterPod.getRepoAndBranchName() + masterPod.attrs.lowerName;
    if (instanceName.indexOf(searchQuery) !== -1) {
      return true;
    }

    return !!masterPod.children.models.find(function (child) {
      return child.attrs.lowerName.indexOf(searchQuery) !== -1;
    });
  };

  this.unbuiltBranches = function(instance, branches) {
    var branchName;
    var childInstances = instance.children.models.reduce(function(childHash, child) {
      branchName = child.getBranchName();
      childHash[branchName] = branchName;
      return childHash;
    }, {});
    var instanceBranchName = instance.getBranchName();
    childInstances[instanceBranchName] = instanceBranchName;

    var unbuiltBranches = branches.models.filter(function(branch) {
      branchName = keypather.get(branch, 'attrs.name');
      return !childInstances[branchName];
    });
    loading('fetchingBranches', false);
    return unbuiltBranches;
  };

  this.popInstanceOpen = function (instance) {
    CIS.poppedInstance = instance;
    CIS.getAllBranches(instance);
  };

  this.getAllBranches = function(instance) {
    CIS.instanceBranches = null;
    loading('fetchingBranches', true);
    return promisify(currentOrg.github, 'fetchRepo')(instance.getRepoName())
      .then(function (repo) {
        return promisify(repo, 'fetchBranches')();
      })
      .then(function (branches) {
        CIS.totalInstanceBranches = branches.models.length;
        CIS.instanceBranches = CIS.unbuiltBranches(instance, branches);
      });
  };

  this.forkBranchFromInstance = function (branch, closePopover) {
    var sha = branch.attrs.commit.sha;
    var loadingName = 'buildingForkedBranch' + branch.attrs.name;
    loading(loadingName, true);
    promisify(CIS.poppedInstance, 'fork')(branch.attrs.name, sha)
      .then(function() {
        loading(loadingName, false);
        CIS.poppedInstance.attrs.hasBranchLaunched = true;
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

  this.setAutofork = function(instance) {
    var shouldNotAutofork = instance.attrs.shouldNotAutofork = !instance.attrs.shouldNotAutofork;
    promisify(instance, 'update')({shouldNotAutofork: shouldNotAutofork});
  };
}
