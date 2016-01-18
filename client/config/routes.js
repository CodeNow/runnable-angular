'use strict';

module.exports = [
  { //- create team flow
    abstract: false,
    state: 'welcome',
    url: '^/welcome',
    templateUrl: 'viewWelcome',
    controller: function ($scope, loading, loadingPromises, $rootScope) {
      window.loading = loading;
      window.$rootScope = $rootScope;
      $rootScope.dataApp = $scope.dataApp = true;
      loading.reset('welcome');
    },
    data: {
      anon: true
    }
  }, {
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
    state: 'orgSelect',
    abstract: false,
    url: '^/orgSelect',
    templateUrl: 'viewOrgSelect',
    controller: 'ControllerOrgSelect',
    controllerAs: 'COS',
    resolve: {
      orgs: function (fetchOrgs) {
        return fetchOrgs();
      }
    }
  }, {
    state: 'serverSelection',
    abstract: false,
    url: '^/:userName/serverSelection/:repo',
    templateUrl: 'viewServerSelection',
    controller: 'ControllerServerSelection',
    data: {
      anon: true
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
      user: function (eventTracking, fetchUser, manuallyWhitelistedUsers) {
        var userFetch = fetchUser()
          .then(function (user) {
            var userName = user.oauthName().toLowerCase();
            user.isManuallyWhitelisted = (manuallyWhitelistedUsers.indexOf(userName) !== -1);
            return user;
          });
        userFetch
          .then(function(user) {
            eventTracking.boot(user);
          });
        return userFetch;
      },
      orgs: function (fetchOrgs) {
        return fetchOrgs();
      },
      activeAccount: function ($q, $stateParams, $state, orgs, $timeout, user, manuallyWhitelistedUsers) {
        var lowerAccountName = $stateParams.userName.toLowerCase();
        var userName = user.oauthName().toLowerCase();
        if (userName === lowerAccountName) {
          if (manuallyWhitelistedUsers.indexOf(userName) !== -1) {
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
