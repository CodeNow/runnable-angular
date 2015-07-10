'use strict';

module.exports = [
  {
    state: 'orgSelect',
    abstract: false,
    url: '^/orgSelect',
    templateUrl: 'viewOrgSelect',
    controller: 'ControllerOrgSelect'
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
    abstract: false,
    url: '^/:userName/',
    templateUrl: 'viewInstanceLayout',
    controller: 'ControllerApp',
    resolve: {
      user: function (fetchUser) {
        return fetchUser();
      },
      orgs: function (fetchOrgs) {
        return fetchOrgs();
      },
      activeAccount: function ($q, $stateParams, $state, user, orgs, $timeout) {
        var lowerAccountName = $stateParams.userName.toLowerCase();
        if (user.oauthName().toLowerCase() === lowerAccountName) {
          return user;
        }

        var matchedOrg = orgs.find(function (org) {
          return org.oauthName().toLowerCase() === lowerAccountName;
        });

        if (!matchedOrg) {
          // There is a bug in ui-router that the workaround
          return $timeout(function () {
            $state.go('base', { userName: user.oauthName() });
            return $q.reject('User Unauthorized for Organization');
          });
        }
        return matchedOrg;
      }
    }
  }, {
    state: 'base.config',
    abstract: true,
    templateUrl: 'viewInstanceLayout',
    controller: 'ControllerInstanceLayout',
    onEnter: function ($rootScope, keypather) {
      keypather.set($rootScope, 'layoutOptions.hideSidebar', true);
      keypather.set($rootScope, 'dataApp.isConfigPage', true);
    },
    onExit: function ($rootScope, keypather) {
      keypather.set($rootScope, 'layoutOptions.hideSidebar', false);
      keypather.set($rootScope, 'dataApp.isConfigPage', false);
    }
  }, {
    state: 'base.config.home',
    abstract: false,
    url: '^/:userName/configure',
    templateUrl: 'environmentView',
    controller: 'EnvironmentController',
    onEnter: function ($rootScope, keypather) {
      keypather.set($rootScope, 'layoutOptions.hideSidebar', true);
      keypather.set($rootScope, 'dataApp.isConfigPage', true);
    },
    onExit: function ($rootScope, keypather) {
      keypather.set($rootScope, 'layoutOptions.hideSidebar', false);
      keypather.set($rootScope, 'dataApp.isConfigPage', false);
    }
  }, {
    state: 'base.instance',
    abstract: true,
    templateUrl: 'viewInstanceLayout',
    controller: 'ControllerInstanceLayout',
    onEnter: function ($rootScope, keypather) {
      keypather.set($rootScope, 'dataApp.isInstancePage', true);
    },
    onExit: function ($rootScope, keypather) {
      keypather.set($rootScope, 'dataApp.isInstancePage', false);
    }
  }, {
    state: 'base.instance.home',
    abstract: false,
    url: '^/:userName',
    templateUrl: 'viewInstanceHome',
    controller: 'ControllerInstanceHome'
  }, {
    state: 'base.instance.instance',
    abstract: false,
    url: '^/:userName/:instanceName',
    templateUrl: 'viewInstance',
    controller: 'ControllerInstance'
  }
];
Object.freeze(module.exports);
