'use strict';

require('app')
  .controller('ControllerInstances', ControllerInstances);
/**
 * @ngInject
 */
function ControllerInstances(
  $filter,
  $localStorage,
  $q,
  $rootScope,
  $scope,
  $state,
  activeAccount,
  ahaGuide,
  composeCardActive,
  currentOrg,
  demoFlowService,
  demoRepos,
  errs,
  eventTracking,
  fetchGitHubRepoBranches,
  fetchInstances,
  fetchInstancesByCompose,
  fetchInstancesByPod,
  fetchRepoBranches,
  isInstanceActive,
  keypather,
  loading,
  ModalService,
  promisify,
  setLastOrg,
  user,
  watchOncePromise
) {
  var CIS = this;
  CIS.userName = $state.params.userName;
  CIS.instanceName = $state.params.instanceName;
  CIS.isInGuide = ahaGuide.isInGuide;
  CIS.shouldShowDemoSelector = demoRepos.shouldShowDemoSelector;
  CIS.isAddingFirstBranch = ahaGuide.isAddingFirstBranch;
  CIS.isSettingUpRunnabot = ahaGuide.isSettingUpRunnabot;
  CIS.isInDemoFlow = demoFlowService.isInDemoFlow;
  CIS.shouldShowAddBranchCTA = demoFlowService.shouldShowAddBranchCTA;
  CIS.shouldShowServicesCTA = demoFlowService.shouldShowServicesCTA.bind(demoFlowService);
  CIS.currentOrg = currentOrg;
  CIS.showAutofork = null;
  CIS.searchBranches = null;
  CIS.instanceBranches = null;
  CIS.unbuiltBranches = null;
  CIS.branchQuery = null;
  CIS.$storage = $localStorage.$default({
    instanceListIsClosed: false
  });

  CIS.shouldShowPopover = true;
  $scope.$on('popover-closed', function (event, pop) {
    if (keypather.get(pop, 'data') === 'branchSelect') {
      CIS.shouldShowPopover = true;
    }
  });

  CIS.shouldShowBranchView = function () {
    // we want to show the add branch view if either the feature flag is on, or if the user has
    // clicked to add a new branch, which would cause the showDemoAddBranchView to return false
     return ($rootScope.featureFlags.demoAutoAddBranch || !CIS.showDemoAddBranchView()) &&
            (!CIS.isInDemoFlow() || demoFlowService.hasSeenUrlCallout());
  };

  $scope.$on('popover-opened', function (event, pop) {
    if (keypather.get(pop, 'data') === 'branchSelect') {
      CIS.shouldShowPopover = false;
    }
  });

  $scope.$on('showAutoLaunchPopover', function() {
    CIS.showAutofork = true;
  });

  /**
   * This listens for new instances to be created for event tracking purposes
   * If the new instance is the first of it's kind (it's grouped as added a new branch)
   * we can report that the user has added their first ever branch!
   */
  function listenForFirstNewBranches () {
    return fetchInstances({
      githubUsername: currentOrg.github.login
    })
      .then(function (allInstances) {
        function instanceListener (instanceModel) {
          if (!instanceModel.attrs.masterPod) {
            var instanceWithParents = allInstances.models.filter(function (instance) {
              return instance.attrs.parent === instanceModel.attrs.parent;
            });
            if (instanceWithParents.length === 1) {
              eventTracking.hasAddedFirstBranch();
              allInstances.off('add', instanceListener);
            }
          }
        }
        allInstances.on('add', instanceListener);
      });
  }

  function isInstanceMatch(instance, nameMatch) {
    if (instance.destroyed || !instance.id()) {
      return false;
    }
    if (!nameMatch || instance.attrs.name === nameMatch) {
      return instance;
    }
  }

  $q.all([
    fetchInstancesByPod(),
    fetchInstancesByCompose(),
    fetchInstances()
  ])
    .then(function (fetchedInstances) {
      var instancesByPod = fetchedInstances[0];
      var instancesByCompose = fetchedInstances[1];
      var allInstances = fetchedInstances[2];

      // Fire-and-forget. Used for event-tracking
      listenForFirstNewBranches();

      // If the state has already changed don't continue with old data. Let the new one execute.
      if (CIS.userName !== $state.params.userName) {
        return;
      }
      CIS.instancesByPod = instancesByPod;
      CIS.defaultComposeClusters = instancesByCompose[0];
      CIS.featureInstancesByCompose = instancesByCompose[1];
      CIS.activeAccount = activeAccount;

      setLastOrg(CIS.userName);

      if ($state.current.name === 'base.instances') {
        // If we're on a blank instances page, but the Demo selector is gone, we need to switch to an instance!
        return watchOncePromise($scope, function () {
          // Wait for any instances to exist
          return allInstances.models.length;
        }, true)
          .then(function () {
            if (demoRepos.shouldShowDemoSelector()) {
              return;
            }
            var lastViewedInstance = keypather.get(user, 'attrs.userOptions.uiState.previousLocation.instance');

            var targetInstance = null;
            if (lastViewedInstance) {
              targetInstance = allInstances.find(function (instance) {
                return isInstanceMatch(instance, lastViewedInstance);
              });
            }

            if (!targetInstance) {
              if (keypather.get(CIS, 'instancesByCompose.length')) {
                targetInstance = $filter('orderBy')(instancesByCompose, 'attrs.name')[0];
              } else {
                targetInstance = $filter('orderBy')(instancesByPod.models, 'attrs.name')[0];
              }
            }
            var instanceName = keypather.get(targetInstance, 'attrs.name');
            return CIS.checkAndLoadInstance(instanceName);
          });
      }
    })
    .catch(errs.handler);

  this.showInstanceRunningPopover = function () {
    return CIS.isInDemoFlow() &&
      !demoFlowService.hasSeenUrlCallout() &&
      CIS.getDemoInstance() &&
      CIS.getDemoInstance().getName() !== $state.params.instanceName &&
      CIS.getDemoInstance().status() === 'running';
  };

  this.getUrlCalloutInstance = function () {
    if (demoFlowService.hasSeenUrlCallout()) {
      return CIS.instancesByPod.models.find(function (instance) {
        return instance.attrs.id === demoFlowService.hasSeenUrlCallout();
      });
    }
  };

  this.showDemoAddBranchView = function () {
    // if this FF is active, we only want to show the view if the branch has been auto added.
    // if this FF is not active, we want ot show the view if the user clicks to add a branch.
    var showDemoAddBranch;
    if ($rootScope.featureFlags.demoAutoAddBranch) {
      showDemoAddBranch = demoFlowService.hasAddedBranch();
    } else {
      showDemoAddBranch = !demoFlowService.hasAddedBranch();
    }
    return demoFlowService.isInDemoFlow() &&
      keypather.get(CIS, 'instancesByPod.models.length') &&
      !demoRepos.shouldShowDemoSelector() &&
      CIS.getUrlCalloutInstance() &&
      showDemoAddBranch;
  };

  this.getDemoInstance = function () {
    if (!CIS.demoInstance) {
      CIS.demoInstance = CIS.instancesByPod.models.find(function (instance) {
        return keypather.get(instance, 'contextVersion.getMainAppCodeVersion()');
      });
    }
    return CIS.demoInstance;
  };

  this.checkAndLoadInstance = function (instanceName) {
    if (instanceName) {
      return $state.go('base.instances.instance', {
        instanceName: instanceName
      });
    }
  };

  this.getNonComposeMasters = function () {
    return this.instancesByPod.filter(function (instance) {
      return !keypather.get(instance, 'attrs.inputClusterConfig._id');
    });
  };


  this.filterMatchedAnything = function () {
    if (!CIS.searchBranches) {
      return true;
    }
    if (!CIS.instancesByPod) {
      return true;
    }

    if ($rootScope.featureFlags.composeNav) {
      if (CIS.isShowingComposeService() || CIS.isShowingNonComposeMaster()) {
        return true;
      }
      var showInstanceByCompose = CIS.instancesByCompose.some(function (composeMaster) {
        return CIS.shouldShowComposeClusterChildren(composeMaster);
      });
      if (showInstanceByCompose) {
        return true;
      }
      return CIS.getNonComposeMasters().some(function (masterInstance) {
        return CIS.shouldShowRepoChildren(masterInstance);
      });
    }

    return CIS.instancesByPod.models.some(function (masterPod) {
      return CIS.filterMasterInstance(masterPod) || CIS.shouldShowParent(masterPod);
    });
  };

  CIS.shouldShowBasic = function (item, pathToName) {
    if (!CIS.searchBranches) {
      return true;
    }
    return (keypather.get(item, pathToName) || '').toLowerCase().includes(CIS.searchBranches.toLowerCase());
  };

  CIS.shouldShowCluster = function (item, pathToName) {
    if (!CIS.searchBranches) {
      return true;
    }
    return (keypather.get(item, 'master.attrs.inputClusterConfig.clusterName') || '').toLowerCase().includes(CIS.searchBranches.toLowerCase()) ||
           CIS.shouldShowBasic(item, pathToName);
  };

  CIS.isShowingNonComposeMaster = function () {
    if (!CIS.searchBranches) {
      return true;
    }
    return CIS.getNonComposeMasters().some(function (instance) {
      return CIS.shouldShowBasic(instance, 'attrs.name');
    });
  };

  CIS.isShowingComposeService = function () {
    if (!CIS.searchBranches) {
      return true;
    }
    return CIS.instancesByCompose.some(function (instance) {
      return CIS.shouldShowBasic(instance, 'master.attrs.name');
    });
  };

  CIS.shouldShowComposeClusterChildren = function (composeCluster) {
    if (!CIS.searchBranches) {
      return true;
    }
    if (!composeCluster.children) {
      return false;
    }
    return composeCluster.children.some(function (childrenCompose) {
      return CIS.shouldShowCluster(childrenCompose, 'master.getBranchName()');
    });
  };

  CIS.shouldShowRepoChildren = function (masterInstance) {
    if (!CIS.searchBranches) {
      return true;
    }
    if (!masterInstance.children.models) {
      return false;
    }
    return masterInstance.children.models.some(function (childInstance) {
      return CIS.shouldShowBasic(childInstance, 'getBranchName()');
    });
  };


  this.filterMasterInstance = function (masterPod) {
    if (!CIS.searchBranches) {
      return true;
    }
    var searchQuery = CIS.searchBranches.toLowerCase();
    var instanceName = masterPod.getRepoAndBranchName() + masterPod.attrs.lowerName;
    return instanceName.toLowerCase().indexOf(searchQuery) !== -1;
  };

  CIS.getSortedMasterInstanceChildren = function (masterPod) {
    var children = masterPod.children.models;
    CIS.instancesByPod
      .filter(function (instance) {
        return masterPod.id() === instance.attrs.testingParentId;
      })
      .forEach(function (instance) {
        children = children.concat(instance.children.models);
      });

    children = $filter('orderBy')(children, 'attrs.isTesting');
    return $filter('orderBy')(children, 'getBranchName()');
  };

  this.getFilteredInstanceList = function () {
    if (!CIS.instancesByPod) {
      return null;
    }
    if (!CIS.searchBranches) {
      return CIS.instancesByPod.models;
    }
    return CIS.instancesByPod.models
      .filter(CIS.filterMasterInstance);
  };

  this.getFilteredTestingMasters = function () {
    return (this.getFilteredInstanceList() || []).filter(function (masterInstance) {
      return masterInstance.attrs.isTesting;
    });
  };

  this.getFilteredBranches = function () {
    if (!CIS.branchQuery) {
      return CIS.instanceBranches;
    }
    var branchName;
    var searchQuery = CIS.branchQuery.toLowerCase();
    return CIS.instanceBranches.filter(function (branch) {
      branchName = branch.name.toLowerCase();
      return branchName.includes(searchQuery);
    });
  };

  this.shouldShowChild = function (childInstance) {
    if (!CIS.searchBranches) {
      return true;
    }
    var searchQuery = CIS.searchBranches.toLowerCase();
    return childInstance.getBranchName().toLowerCase().indexOf(searchQuery) !== -1;
  };

  this.shouldShowParent = function (masterPod) {
    if (!CIS.searchBranches) {
      return true;
    }
    if (!masterPod.children) {
      return false;
    }
    return masterPod.children.models.some(CIS.shouldShowChild);
  };

  this.getUnbuiltBranches = function (instance, branches) {
    var branchName;
    var childInstances = instance.children.models.reduce(function (childHash, child) {
      branchName = child.getBranchName();
      childHash[branchName] = branchName;
      return childHash;
    }, {});
    var instanceBranchName = instance.getBranchName();
    childInstances[instanceBranchName] = instanceBranchName;
    var unbuiltBranches = branches.filter(function (branch) {
      branchName = keypather.get(branch, 'name');
      return !childInstances[branchName];
    });
    return unbuiltBranches;
  };

  this.popClusterOpen = function (featureBranchCluster) {
    var shouldAutofork = [];
    var shouldNotAutofork = [];
    CIS.defaultComposeClusters.forEach(function (defaultClusters) {
      if (defaultClusters.repoName === featureBranchCluster.repoName) {
        defaultClusters.clusters.forEach(function (cluster) {
          cluster.master.attrs.shouldNotAutofork ? shouldNotAutofork.push(cluster.master) : shouldAutofork.push(cluster.master);
        })
      }
    });
    CIS.instanceBranches = null;
    CIS.poppedCluster = featureBranchCluster;
    CIS.poppedCluster.shouldNotAutofork = shouldNotAutofork.length > shouldAutofork.length;
    CIS.poppedCluster.shouldNotAutofork ? CIS.poppedCluster.clustersToToggleAutofork = shouldNotAutofork : CIS.poppedCluster.clustersToToggleAutofork = shouldAutofork;
    loading('fetchingBranches', true);
    return fetchGitHubRepoBranches(featureBranchCluster.githubOrg, featureBranchCluster.repoName)
      .then(function (branches) {
        CIS.totalInstanceBranches = branches.length;
        CIS.instanceBranches = branches;
        loading('fetchingBranches', false);
      });
  };

  this.popInstanceOpen = function (instance) {
    CIS.instanceBranches = null;
    CIS.poppedInstance = instance;
    loading('fetchingBranches', true);
    var acv = instance.contextVersion.getMainAppCodeVersion();
    if (!acv) {
      return $q.reject(new Error('acv is required'));
    }
    var fullReponame = acv.attrs.repo.split('/');
    var orgName = fullReponame[0];
    var repoName = fullReponame[1];
    return fetchGitHubRepoBranches(orgName, repoName)
      .then(function (branches) {
        CIS.totalInstanceBranches = branches.length;
        CIS.instanceBranches = CIS.getUnbuiltBranches(instance, branches);
        loading('fetchingBranches', false);
      });
  };

  this.getAllBranches = function (instance) {
    return promisify(currentOrg.github, 'fetchRepo')(instance.getRepoName())
      .then(function (repo) {
        return fetchRepoBranches(repo);
      });
  };

  this.forkBranchFromInstance = function (branch, closePopover) {
    var instancesToFork = [];
    var sha = branch.commit.sha;
    var branchName = branch.name;
    loading(branchName, true);
    loading('buildingForkedBranch', true);
    if (CIS.poppedCluster) {
      var defaultCluster = CIS.defaultComposeClusters.find(function (cluster) {
        return cluster.repoName === keypather.get(CIS, 'poppedCluster.repoName');
      });
      defaultCluster.clusters.forEach(function (defaultCluster) {
        instancesToFork.push(defaultCluster.master);
        if (defaultCluster.testing) {
          defaultCluster.testing.forEach(function (instance) {
            if (instance.attrs.inputClusterConfig.masterInstanceId === instance.id()) {
              instancesToFork.push(instance);
            }
          });
        }
      });
    } else {
      instancesToFork.push(CIS.poppedInstance);
    }
    $q.all(instancesToFork.map(function (instance) {
      return promisify(instance, 'fork')(branchName, sha);
    }))
      .then(function (instances) {
        loading(branchName, false);
        loading('buildingForkedBranch', false);
        closePopover();
      })
      .catch(errs.handler);
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

  this.setAutofork = function () {
    if (CIS.poppedCluster) {
      CIS.poppedCluster.shouldNotAutofork = !CIS.poppedCluster.shouldNotAutofork;
      return CIS.poppedCluster.clustersToToggleAutofork.map(function (instanceToToggleAutofork) {
        return promisify(instanceToToggleAutofork, 'update')({ shouldNotAutofork: CIS.poppedCluster.shouldNotAutofork })
          .catch(function () {
            instanceToToggleAutofork.attrs.shouldNotAutofork = !instanceToToggleAutofork.attrs.shouldNotAutofork;
          });
      })
    }
    CIS.poppedInstance.attrs.shouldNotAutofork = !CIS.poppedInstance.attrs.shouldNotAutofork;
    if (!CIS.poppedInstance.attrs.shouldNotAutofork) {
      eventTracking.enabledAutoLaunch();
    }
    if (CIS.isInGuide() && !CIS.poppedInstance.attrs.shouldNotAutofork) {
      var childWatcher = $scope.$watch('CIS.poppedInstance.children.models.length', function (length) {
        if (length) {
          $rootScope.$broadcast('ahaGuide::launchModal');
          childWatcher();
        }
      });
    } else if (!CIS.poppedInstance.attrs.shouldNotAutofork) {
      CIS.showAutofork = false;
    }
    promisify(CIS.poppedInstance, 'update')({ shouldNotAutofork: CIS.poppedInstance.attrs.shouldNotAutofork })
      .catch(function () {
        CIS.poppedInstance.attrs.shouldNotAutofork = !CIS.poppedInstance.attrs.shouldNotAutofork;
      });
  };

  this.addOwnRepo = function () {
    ModalService.showModal({
      controller: 'NewContainerModalController',
      controllerAs: 'NCMC',
      templateUrl: 'newContainerModalView'
    });
  };

  this.isCardActive = isInstanceActive;
  this.isComposeCardActive = composeCardActive;
}
