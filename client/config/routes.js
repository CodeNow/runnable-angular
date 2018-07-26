'use strict';

function goToStateOnError($q, $state, $timeout, destination, errorMessage) {
  return function () {
    return $timeout(function () {
      $state.go(destination);
      return $q.reject(new Error(errorMessage));
    });
  };
}

function setAppUser(fetchUser, $rootScope, keypather) {
  return fetchUser()
    .then(function (user) {
      keypather.set($rootScope, 'dataApp.data.user', user);
      return user;
    });
}

module.exports = [
  {
    state: 'loadingDebug',
    url: '^/loading'
  }, {
    state: 'debug',
    url: '^/debug/:containerId/',
    templateUrl: 'debugView',
    controller: 'DebugController',
    controllerAs: 'DC',
    resolve: {
      debugContainer: function(fetchDebugContainer, $stateParams){
        return fetchDebugContainer($stateParams.containerId);
      },
      instance: function (debugContainer, fetchInstance) {
        return fetchInstance(debugContainer.attrs.instance);
      }
    }
  }, {
    state: 'index',
    abstract: false,
    url: '^/',
    templateUrl: 'viewBaseLayout',
    controller: 'IndexController',
    controllerAs: 'COS',
    resolve: {
      user: function ($q, $state, fetchUser, fetchGrantedGithubOrgs, keypather) {
        return $q.all({ user: fetchUser(), grantedOrgs: fetchGrantedGithubOrgs() })
          .then(function (userAndGrantedOrgs) {
            var prevLocation = keypather.get(userAndGrantedOrgs, 'user.attrs.userOptions.uiState.previousLocation.org');
            var prevInstance = keypather.get(userAndGrantedOrgs, 'user.attrs.userOptions.uiState.previousLocation.instance');
            if (prevLocation) {
              if (prevInstance) {
                $state.go('base.instances.instance', {
                  userName: prevLocation,
                  instanceName: prevInstance
                });
              } else {
                $state.go('base.instances', {
                  userName: prevLocation
                });
              }
            } else if (!keypather.get(userAndGrantedOrgs, 'grantedOrgs.models.length')) {
              $state.go('base.instances', {
                  userName: keypather.get(userAndGrantedOrgs, 'user.attrs.accounts.github.username')
                });
            } else {
              $state.go('orgSelect');
            }
            return userAndGrantedOrgs.user;
          });
      }
    }
  }, {
    state: 'orgSelect',
    abstract: false,
    url: '^/orgSelect',
    controller: 'OrgSelectController',
    onExit: function (
      ModalService,
      keypather
    ) {
      keypather.get(ModalService, 'modalLayers[0].modal.controller.close()');
    },
    onEnter: function (
      ModalService
    ) {
      ModalService.modalLayers.forEach(function (openModal) {
        openModal.close();
      });
    },
    resolve: {
      grantedOrgs: function (fetchGrantedGithubOrgs) {
        return fetchGrantedGithubOrgs();
      },
      user: function (fetchUser, $rootScope, keypather) {
        return setAppUser(fetchUser, $rootScope, keypather);
      },
      whitelistedOrgs: function (fetchWhitelistForDockCreated) {
        return fetchWhitelistForDockCreated();
      },
      booted: function (eventTracking, user, fetchGrantedGithubOrgs) {
        eventTracking.boot(user);
        fetchGrantedGithubOrgs()
          .then(function (orgs) {
            eventTracking.visitedOrgSelectPage(orgs.models.length);
          });
      }
    }
  }, {
    state: 'githubAuth',
    abstract: false,
    url: '^/githubAuth',
    templateUrl: 'githubAuthView',
    controller: 'GithubAuthController',
    controllerAs: 'GAC',
    data: {
      anon: true
    },
    resolve: {
      user: function (fetchUser, $rootScope, keypather) {
        return setAppUser(fetchUser, $rootScope, keypather);
      },
      booted: function (eventTracking, user) {
        return eventTracking.boot(user);
      }
    }
  }, {
    state: 'githubAuthUpgrade',
    abstract: false,
    url: '^/githubAuthUpgrade',
    templateUrl: 'composeSshAuthView',
    controller: 'ComposeSshAuthController',
    controllerAs: 'CSAC',
    resolve: {
      user: function (fetchUser, $rootScope, keypather) {
        return setAppUser(fetchUser, $rootScope, keypather);
      }
    }
  }, {
    state: 'paused',
    abstract: false,
    url: '^/paws’d',
    templateUrl: 'pausedSandboxView',
    controller: 'WelcomeBackController',
    controllerAs: 'WBC',
    resolve: {
      user: function (fetchUser, $rootScope, keypather) {
        return setAppUser(fetchUser, $rootScope, keypather);
      },
      booted: function (eventTracking, user) {
        return eventTracking.boot(user);
      }
    }
  }, {
    state: 'myAppRedirect',
    url: '^/-myAppRedirect/:demoName',
    abstract: false,
    resolve: {
      user: function (fetchUser, $rootScope, keypather) {
        return setAppUser(fetchUser, $rootScope, keypather);
      }
    },
    onEnter: function (
      $stateParams,
      redirectFromLocalStorage
    ) {
      redirectFromLocalStorage.toApp($stateParams.demoName);
    }

  }, {
    state: 'myRunAppRedirect',
    url: '^/-myRunAppRedirect/:demoName',
    abstract: false,
    resolve: {
      user: function (fetchUser, $rootScope, keypather) {
        return setAppUser(fetchUser, $rootScope, keypather);
      }
    },
    onEnter: function (
      $stateParams,
      redirectFromLocalStorage
    ) {
      redirectFromLocalStorage.toRunApp($stateParams.demoName);
    },
  }, {
    state: 'noAccess',
    url: '^/-noAccess',
    abstract: false,
    templateUrl: 'noAccessView',
    resolve: {
      user: function (fetchUser, $rootScope, keypather) {
        return setAppUser(fetchUser, $rootScope, keypather);
      }
    }

  }, {
    state: 'branchSelection',
    abstract: false,
    url: '^/branchSelection/:hostname',
    templateUrl: 'viewBranchSelection',
    controller: 'ControllerBranchSelection',
    data: {
      anon: true
    }
  }, {
    state: 'base',
    abstract: true,
    url: '^/:userName/',
    templateUrl: 'viewBaseLayout',
    controller: 'ControllerApp',
    controllerAs: 'CA',
    resolve: {
      user: function ($q, $state, $timeout, fetchUser, manuallyWhitelistedUsers) {
        return fetchUser()
          .then(function (user) {
            var userName = user.oauthName().toLowerCase();
            user.isManuallyWhitelisted = manuallyWhitelistedUsers.includes(userName);
            return user;
          })
          .catch(goToStateOnError($q, $state, $timeout, 'orgSelect', 'Unauthorized'));
      },
      whitelists: function (fetchWhitelistForDockCreated) {
        return fetchWhitelistForDockCreated();
      },
      orgs: function (fetchWhitelistedOrgs) {
        return fetchWhitelistedOrgs();
      },
      activeOrg: function (
        $stateParams,
        whitelists
      ) {
        var lowerAccountName = $stateParams.userName.toLowerCase();
        return whitelists.find(function (whitelist) {
          return whitelist.attrs.lowerName === lowerAccountName;
        });
      },
      activeAccount: function (
        $q,
        $state,
        $stateParams,
        $timeout,
        activeOrg,
        eventTracking,
        featureFlags,
        orgs,
        user
      ) {
        var lowerAccountName = $stateParams.userName.toLowerCase();
        var userName = user.oauthName().toLowerCase();
        if (userName === lowerAccountName) {
          if (user.isManuallyWhitelisted) {
            return user;
          }
        }

        var matchedOrg = orgs.find(function (org) {
          return org.oauthName().toLowerCase() === lowerAccountName;
        });
        if (!matchedOrg) {
          // There is a bug in ui-router and a timeout is the workaround
          return $timeout(function () {
            $state.go('orgSelect');
            return $q.reject(new Error('User Unauthorized for Organization'));
          });
        }
        if (!activeOrg.attrs.isActive) {
          // There is a bug in ui-router and a timeout is the workaround
          return $timeout(function () {
            $state.go('paused');
            return $q.reject(new Error('Account paused'));
          });
        }
        eventTracking.boot(user, {orgName: $stateParams.userName});
        return matchedOrg;
      },
      populateCurrentOrgService: function (
        activeOrg,
        activeAccount,
        currentOrg
      ) {
        currentOrg.poppa = activeOrg;
        currentOrg.github = activeAccount;
      }
    }
  }, {
    state: 'base.config',
    abstract: false,
    url: '^/:userName/configure',
    templateUrl: 'environmentView',
    controller: 'EnvironmentController',
    controllerAs: 'EC',
    onExit: function (
      ModalService,
      keypather
    ) {
      keypather.get(ModalService, 'modalLayers[0].modal.controller.actions.forceClose()');
    },
    resolve: {
      checkIfAllowed: function (
        $state,
        $stateParams,
        demoFlowService,
        featureFlags,
        populateCurrentOrgService // unused, but required so things are properly populated!
      ) {
        if (demoFlowService.isInDemoFlow()) {
          return $state.go('base.instances', {
            userName: $stateParams.userName
          });
        }
      },
      instancesByPod: function (
        $q,
        $stateParams,
        $state,
        $timeout,
        fetchInstancesByPod,
        populateCurrentOrgService // unused, but required so things are properly populated!
      ) {
        $state.params.userName = $stateParams.userName;
        return fetchInstancesByPod()
          .catch(goToStateOnError($q, $state, $timeout, 'orgSelect', 'Unauthorized'));
      },
      booted: function (eventTracking, activeAccount) {
        eventTracking.visitedConfigurePage();
      }
    }
  }, {
    state: 'base.instances',
    abstract: false,
    url: '^/:userName/',
    templateUrl: 'viewInstances',
    controller: 'ControllerInstances',
    controllerAs: 'CIS',
    onExit: function (
      ModalService,
      keypather
    ) {
      keypather.get(ModalService, 'modalLayers[0].modal.controller.actions.forceClose()');
    },
    resolve: {
      instancesByPod: function (
        $q,
        $stateParams,
        $state,
        $timeout,
        fetchInstancesByPod
      ) {
        $state.params.userName = $stateParams.userName;
        return fetchInstancesByPod()
          .catch(goToStateOnError($q, $state, $timeout, 'orgSelect', 'Unauthorized'));
      },
      booted: function (
        currentOrg,
        eventTracking,
        populateCurrentOrgService
      ) {
        eventTracking.visitedContainersPage(currentOrg.isPersonalAccount());
      }
    }
  }, {
    state: 'base.instances.instance',
    abstract: false,
    url: '^/:userName/:instanceName',
    templateUrl: 'viewInstance',
    controller: 'ControllerInstance',
    controllerAs: 'CI',
    onExit: function (
      ModalService,
      keypather
    ) {
      keypather.get(ModalService, 'modalLayers[0].modal.controller.actions.forceClose()');
    },
    resolve: {
      instancesByPod: function (
        $q,
        $stateParams,
        $state,
        $timeout,
        fetchInstancesByPod
      ) {
        $state.params.userName = $stateParams.userName;
        return fetchInstancesByPod()
          .catch(goToStateOnError($q, $state, $timeout, 'orgSelect', 'Unauthorized'));
      }
    }
  }, {
    state: 'base.instances.instance-test',
    abstract: true,
    url: '^/:userName/:instanceName/test',
  }, {
    state: 'base.instances.instance-test-sha',
    abstract: false,
    url: '^/:userName/:instanceName/test/:sha',
    controller: 'TestInstanceViewController',
    controllerAs: 'TIVC',
    templateUrl: 'viewTestInstance',
    resolve: {
      testInstance: function (
        $rootScope,
        $state,
        $stateParams,
        $timeout,
        fetchInstanceByName,
        fetchInstanceTestHistoryBySha
        ) {
          return fetchInstanceByName($stateParams.instanceName)
            .then(function(instance) {
              if (!instance) {
                return $state.go('base.instances', {
                  userName: $stateParams.userName
               });
              }
              return fetchInstanceTestHistoryBySha(instance.id(), $stateParams.sha)
                .then(function(history) {
                  if (!history) {
                    return $state.go('base.instances.instance', {
                      instanceName: $stateParams.instanceName,
                      userName: $stateParams.userName
                    });
                  }
                  instance.containerHistory = history;
                  var stopListening = $rootScope.$on('$stateChangeStart', function (event, toState) {
                    stopListening();
                    if (toState.state !== 'base.instances.instance-test-sha') {
                      delete instance.containerHistory;
                    }
                  });
                  return instance;
                });
            });
      }
    }
  }
];
Object.freeze(module.exports);
