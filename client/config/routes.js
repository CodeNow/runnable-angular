'use strict';

module.exports = [
  // TEST $root.featureFlags.debugMode
  // {
  //   state: 'debug',
  //   abstract: false,
  //   url: '^/debug',
  //   templateUrl: 'viewDebug',
  //   data: {
  //     anon: true
  //   }
  // },
  // TEST $root.featureFlags.debugMode
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
    abstract: true,
    url: '^/:userName/',
    templateUrl: 'viewInstanceLayout',
    controller: 'ControllerApp',
    controllerAs: 'CA'
  }, {
    state: 'config',
    abstract: true,
    templateUrl: 'viewInstanceLayout',
    controller: 'ControllerInstanceLayout',
    controllerAs: 'CIL',
    onEnter: function ($rootScope, keypather) {
      keypather.set($rootScope, 'layoutOptions.hideSidebar', true);
    },
    onExit: function ($rootScope, keypather) {
      keypather.set($rootScope, 'layoutOptions.hideSidebar', false);
    }
  }, {
    state: 'config.home',
    abstract: false,
    url: '^/:userName/configure',
    templateUrl: 'environmentView',
    controller: 'EnvironmentController',
    onEnter: function ($rootScope, keypather) {
      keypather.set($rootScope, 'layoutOptions.hideSidebar', true);
    },
    onExit: function ($rootScope, keypather) {
      keypather.set($rootScope, 'layoutOptions.hideSidebar', false);
    }
  }, {
    state: 'instance',
    abstract: true,
    templateUrl: 'viewInstanceLayout',
    controller: 'ControllerInstanceLayout',
    controllerAs: 'CIL'
  }, {
    state: 'instance.home',
    abstract: false,
    url: '^/:userName',
    templateUrl: 'viewInstanceHome',
    controller: 'ControllerInstanceHome'
  }, {
    state: 'instance.instance',
    abstract: false,
    url: '^/:userName/:instanceName',
    templateUrl: 'viewInstance',
    controller: 'ControllerInstance'
  }
];
Object.freeze(module.exports);
