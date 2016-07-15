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
    templateUrl: 'viewOrgSelect',
    controller: 'indexController',
    controllerAs: 'COS',
    resolve: {
      user: function ($q, fetchUser, getFirstDockStartedOrg, keypather, $state) {
        return $q.all({
          firstDock: getFirstDockStartedOrg(),
          user: fetchUser()
        })
          .then(function (results) {
            if (!results.firstDock) {
              // No org has been set up, so go to org-select
              $state.go('orgSelect', { notify: true });
            }
            var user = results.user;
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
    resolve: {
      grantedOrgs: function (fetchGrantedGithubOrgs) {
        return fetchGrantedGithubOrgs();
      },
      user: function (fetchUser) {
        return fetchUser();
      },
      whitelistedOrgs: function (fetchWhitelistedOrgs) {
        return fetchWhitelistedOrgs()
          .catch(angular.noop);
      }
    }
  }, {
    state: 'paused',
    abstract: false,
    url: '^/paws’d',
    templateUrl: 'gracePeriodModalView',
    controller: 'GracePeriodController',
    controllerAs: 'GPC',
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
        return fetchWhitelistedOrgs()
          .catch(angular.noop);
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
