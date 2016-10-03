'use strict';

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
      user: function ($state, fetchUser, keypather) {
        return fetchUser()
          .then(function (user) {
            var prevLocation = keypather.get(user, 'attrs.userOptions.uiState.previousLocation.org');
            var prevInstance = keypather.get(user, 'attrs.userOptions.uiState.previousLocation.instance');
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
            } else {
              $state.go('orgSelect');
            }
            return user;
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
    resolve: {
      grantedOrgs: function (fetchGrantedGithubOrgs) {
        return fetchGrantedGithubOrgs();
      },
      user: function (fetchUser, $rootScope, keypather) {
        return fetchUser()
          .then(function (user) {
            keypather.set($rootScope, 'dataApp.data.user', user);
            return user;
          });
      },
      whitelistedOrgs: function (fetchWhitelistForDockCreated) {
        return fetchWhitelistForDockCreated();
      },
      booted: function (eventTracking, user) {
        eventTracking.boot(user);
        eventTracking.visitedOrgSelectPage();
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
        return fetchUser()
          .then(function (user) {
            keypather.set($rootScope, 'dataApp.data.user', user);
            return user;
          });
      },
      booted: function (eventTracking, user) {
        return eventTracking.boot(user);
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
          .catch(function () {
            return $timeout(function () {
              $state.go('orgSelect');
              return $q.reject(new Error('User Unauthorized for Organization'));
            });
          });
      },
      whitelists: function (fetchWhitelists) {
        return fetchWhitelists();
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
        if ((!featureFlags.flags.billing && !activeOrg.attrs.allowed) || (featureFlags.flags.billing && !activeOrg.attrs.isActive)) {
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
    resolve: {
      instancesByPod: function (fetchInstancesByPod, $stateParams, $state) {
        $state.params.userName = $stateParams.userName;
        return fetchInstancesByPod();
      }
    }
  }, {
    state: 'base.instances',
    abstract: false,
    url: '^/:userName/',
    templateUrl: 'viewInstances',
    controller: 'ControllerInstances',
    controllerAs: 'CIS',
    resolve: {
      instancesByPod: function (fetchInstancesByPod, $stateParams, $state) {
        $state.params.userName = $stateParams.userName;
        return fetchInstancesByPod();
      },
      hasConfirmedSetup: function (
        $rootScope,
        $state,
        $stateParams,
        $timeout,
        ahaGuide,
        featureFlags,
        populateCurrentOrgService // Unused, but required so things are properly populated!
      ) {
        if (featureFlags.flags.aha && ahaGuide.isInGuide() && !ahaGuide.hasConfirmedSetup()) {
          $timeout(function () {
            $state.go('base.config', {
              userName: $stateParams.userName
            });
          });
        }
      },
      booted: function (eventTracking) {
        eventTracking.visitedContainersPage();
      }
    }
  }, {
    state: 'base.instances.instance',
    abstract: false,
    url: '^/:userName/:instanceName',
    templateUrl: 'viewInstance',
    controller: 'ControllerInstance',
    controllerAs: 'CI',
    resolve: {
      instancesByPod: function (fetchInstancesByPod, $stateParams, $state) {
        $state.params.userName = $stateParams.userName;
        return fetchInstancesByPod();
      }
    }
  }
];
Object.freeze(module.exports);
