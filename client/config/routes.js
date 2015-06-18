'use strict';

module.exports = [
  {
    state: 'home',
    abstract: false,
    url: '^/',
    templateUrl: 'viewHome',
    controller: 'ControllerHome',
    data: {
      bodyClass: {
        'home': true
      },
      anon: true
    }
  }, {
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
    controller: 'ControllerApp'
  }, {
    state: 'config',
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
    state: 'config.home',
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
    state: 'config.instance',
    abstract: false,
    url: '^/:userName/configure/:instanceName',
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
    state: 'instance',
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
    state: 'instance.home',
    abstract: false,
    url: '^/:userName',
    templateUrl: 'viewInstanceHome',
    controller: 'ControllerInstanceHome'
  }, {
    state: 'error',
    abstract: false,
    url: '^/error/:err',
    templateUrl: 'viewError',
    controller: 'ControllerError'
  }, {
    state: 'instance.instance',
    abstract: false,
    url: '^/:userName/:instanceName',
    templateUrl: 'viewInstance',
    controller: 'ControllerInstance'
  }
];
Object.freeze(module.exports);
