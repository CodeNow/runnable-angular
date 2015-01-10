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
    state: 'features',
    abstract: false,
    url: '^/features',
    templateUrl: 'viewFeatures',
    data: {
      bodyClass: {
        'vertical': true
      },
      anon: true
    }
  }, {
    state: 'pricing',
    abstract: false,
    url: '^/pricing',
    templateUrl: 'viewPricing',
    data: {
      bodyClass: {
        'vertical': true
      },
      anon: true
    }
  }, {
    state: 'boxSelection',
    abstract: false,
    url: '^/:userName/boxSelection/:repo/:branch/:message/:commit',
    templateUrl: 'viewBoxSelection',
    controller: 'ControllerBoxSelection',
    data: {
      bodyClass: {
        'vertical': true
      },
      anon: true
    }
  // }, {
  //   state: 'edemo',
  //   abstract: false,
  //   url: '^/demo',
  //   templateUrl: 'viewDemo'
  // }, {
  //   state: 'edemo2',
  //   abstract: false,
  //   url: '^/demo2',
  //   templateUrl: 'viewDemo2'
  // }, {
  //   state: 'edemo3',
  //   abstract: false,
  //   url: '^/demo3',
  //   templateUrl: 'viewDemo3'
  // }, {
  //   state: 'edemo4',
  //   abstract: false,
  //   url: '^/demo4',
  //   templateUrl: 'viewDemo4'
  // }, {
  //   state: 'demo',
  //   abstract: true,
  //   templateUrl: 'viewDemoLayout',
  //   controller: 'ControllerDemoLayout'
  // }, {
  //   state: 'demo.instance',
  //   abstract: false,
  //   url: '^/demo/:userName/:instanceName',
  //   templateUrl: 'viewInstance',
  //   controller: 'ControllerInstance'
  // }, {
  //   state: 'demo.instanceEdit',
  //   abstract: false,
  //   url: '^/demo/:userName/:instanceName/edit/:buildId',
  //   templateUrl: 'viewInstanceEdit',
  //   controller: 'ControllerInstanceEdit',
  //   data: {
  //     bodyClass: {
  //       'guide-backdrop': true
  //     }
  //   }
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
  }, {
    state: 'instance.instanceEdit',
    abstract: false,
    url: '^/:userName/:instanceName/edit/:buildId',
    templateUrl: 'viewInstanceEdit',
    controller: 'ControllerInstanceEdit'
  }
];
Object.freeze(module.exports);
