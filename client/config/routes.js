module.exports = [
  {
    state: 'home',
    abstract: false,
    url: '^/',
    templateUrl: 'viewHome',
    controller: 'ControllerHome',
    data: {
      bodyClass: {
        'landing': true
      },
    }
  },
  /*{
    state: 'edemo',
    abstract: false,
    url: '^/demo',
    templateUrl: 'viewDemo'
  }, {
    state: 'edemo2',
    abstract: false,
    url: '^/demo2',
    templateUrl: 'viewDemo2'
  }, {
    state: 'edemo3',
    abstract: false,
    url: '^/demo3',
    templateUrl: 'viewDemo3'
  }, {
    state: 'edemo4',
    abstract: false,
    url: '^/demo4',
    templateUrl: 'viewDemo4'
  }, */{
    state: 'demo',
    abstract: true,
    templateUrl: 'viewDemoLayout',
    controller: 'ControllerDemoLayout'
  }, {
    state: 'demo.anon',
    abstract: false,
    url: '^/demo/:userName/:instanceName',
    templateUrl: 'viewInstanceAnon',
    controller: 'ControllerInstanceAnon'
  }, {
    state: 'demo.edit',
    abstract: false,
    url: '^/demo/:userName/:instanceName/edit/:buildId',
    templateUrl: 'viewInstanceEdit',
    controller: 'ControllerInstanceEdit',
    data: {
      bodyClass: {
        'guide-backdrop': true
      }
    }
  }, {
    state: 'instance',
    abstract: true,
    templateUrl: 'viewInstanceLayout',
    controller: 'ControllerInstanceLayout'
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
