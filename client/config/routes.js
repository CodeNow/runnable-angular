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
        return fetchWhitelistedOrgs();
      },
      activeOrg: function (
        $stateParams,
        whitelists,
        moment
      ) {
        var lowerAccountName = $stateParams.userName.toLowerCase();
        var activeOrg =  whitelists.find(function (whitelist) {
          return whitelist.attrs.lowerName === lowerAccountName;
        });
        // All of this should be moved to inside @runnable/api-client
        activeOrg.attrs.trialEnd = moment().add(2, 'days').toISOString();
        activeOrg.attrs.activePeriodEnd = moment().subtract(1, 'days').toISOString();
        activeOrg.attrs.gracePeriodEnd = moment().add(5, 'days').toISOString();
        activeOrg.attrs.stripeCustomerId = 1234;
        activeOrg.attrs.hasPaymentMethod = false;
        activeOrg.isInTrial = function () {
          return moment(activeOrg.attrs.trialEnd) > moment().utc();
        };
        activeOrg.isInGrace = function () {
          return !activeOrg.isInTrial() && moment(activeOrg.attrs.gracePeriodEnd) > moment().utc();
        };
        activeOrg.isInActivePeriod = function () {
          return moment(activeOrg.attrs.activePeriodEnd) > moment().utc();
        };
        activeOrg.isGraceExpired = function () {
          return !activeOrg.isInTrial() && moment.utc(activeOrg.attrs.gracePeriodEnd) < moment().utc();
        };
        activeOrg.trialDaysRemaining = function () {
          return moment(activeOrg.attrs.trialEnd).diff(moment.utc(), 'days');
        };
        return activeOrg;
      },
      activeAccount: function (
        $q,
        $stateParams,
        $state,
        orgs,
        whitelists,
        $timeout,
        user,
        eventTracking,
        activeOrg
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
        if (!activeOrg.attrs.allowed) {
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
