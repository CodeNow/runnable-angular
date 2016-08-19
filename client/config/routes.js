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
    templateUrl: 'viewOrgSelect',
    controller: 'ChooseOrganizationModalController',
    controllerAs: 'COS',
    onExit: function ($rootScope) {
      $rootScope.$broadcast('app-document-click');
      $rootScope.$broadcast('close-modal');
    },
    resolve: {
      grantedOrgs: function (fetchGrantedGithubOrgs) {
        return fetchGrantedGithubOrgs();
      },
      user: function (fetchUser) {
        return fetchUser();
      },
      whitelistedOrgs: function (fetchWhitelistForDockCreated) {
        return fetchWhitelistForDockCreated();
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
      user: function (fetchUser) {
        return fetchUser();
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
      activeAccount: function (
        $q,
        $stateParams,
        $state,
        orgs,
        whitelists,
        $timeout,
        user,
        eventTracking
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
        var foundWhitelist = whitelists.find(function (whitelist) {
          return whitelist.attrs.lowerName === lowerAccountName;
        });
        if (!foundWhitelist.attrs.allowed) {
          // There is a bug in ui-router and a timeout is the workaround
          return $timeout(function () {
            $state.go('paused');
            return $q.reject(new Error('Account paused'));
          });
        }
        eventTracking.boot(user, {orgName: $stateParams.userName});
        return matchedOrg;
      }
    }
  }, {
    state: 'base.config',
    abstract: false,
    url: '^/:userName/configure',
    templateUrl: 'environmentView',
    controller: 'EnvironmentController',
    controllerAs: 'EC'
  }, {
    state: 'base.instances',
    abstract: false,
    url: '^/:userName/',
    templateUrl: 'viewInstances',
    controller: 'ControllerInstances',
    controllerAs: 'CIS'
  }, {
    state: 'base.instances.instance',
    abstract: false,
    url: '^/:userName/:instanceName',
    templateUrl: 'viewInstance',
    controller: 'ControllerInstance'
  }
];
Object.freeze(module.exports);
