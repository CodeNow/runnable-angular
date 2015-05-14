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
        'vertical': true
      },
      anon: true
    }
  }, {
    state: 'invite',
    abstract: false,
    url: '^/invite',
    templateUrl: 'viewInvite',
    data: {
      bodyClass: {
        'vertical': true
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
      bodyClass: {
        'vertical': true
      },
      anon: true
    }
  }, {
    state: 'branchSelection',
    abstract: false,
    url: '^/branchSelection/:hostname',
    templateUrl: 'viewBranchSelection',
    controller: 'ControllerBranchSelection',
    data: {
      bodyClass: {
        'vertical': true
      },
      anon: true
    }
  }, {
    state: 'base',
    abstract: true,
    url: '^/:userName/',
    templateUrl: 'viewInstanceLayout',
    controller: 'ControllerApp'
  }, {
    state: 'config.home',
    abstract: false,
    url: '^/:userName/configure',
    templateUrl: 'environmentView',
    controller: 'EnvironmentController'
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
    state: '404',
    abstract: false,
    templateUrl: 'view404',
    controller: 'ControllerError'
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
  }, {
    state: 'config',
    abstract: true,
    templateUrl: 'viewInstanceLayout',
    controller: 'ControllerInstanceLayout',
    onEnter: function ($rootScope, keypather) {
      keypather.set($rootScope, 'layoutOptions.hideSidebar', true);
    },
    onExit: function ($rootScope, keypather) {
      keypather.set($rootScope, 'layoutOptions.hideSidebar', false);
    }
  }
];
Object.freeze(module.exports);
