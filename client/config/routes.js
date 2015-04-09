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
    state: 'naviSelection',
    abstract: false,
    url: '^/:userName/naviSelection/:hostname',
    templateUrl: 'viewNaviSelection',
    controller: 'ControllerNaviSelection',
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
    state: 'instance',
    abstract: true,
    templateUrl: 'viewInstanceLayout',
    controller: 'ControllerInstanceLayout'
  }, {
    state: 'instance.home',
    abstract: false,
    url: '^/:userName',
    templateUrl: 'viewInstanceHome',
    controller: 'ControllerInstanceHome'
  }, {
    state: 'instance.new',
    abstract: false,
    url: '^/:userName/new',
    controller: 'ControllerNew'
  }, {
    state: 'instance.setup',
    abstract: false,
    url: '^/:userName/new/:buildId',
    templateUrl: 'viewSetup',
    controller: 'ControllerSetup'
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
  }
];
Object.freeze(module.exports);
