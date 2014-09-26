module.exports = [{
  state: 'home',
  abstract: false,
  url: '^/',
  templateUrl: 'viewHome',
  controller: 'ControllerHome',
  data: {
    bodyClass: {
      'width-full': true
    },
  }
}, {
  state: '404',
  abstract: false,
  templateUrl: 'viewError',
  controller: 'ControllerError'
}, {
  state: 'instance',
  abstract: true,
  templateUrl: 'viewInstanceLayout',
  controller: 'ControllerInstanceLayout'
}, {
  state: 'instance.new',
  abstract: false,
  url: '^/:userName/new',
  templateUrl: 'viewSetup',
  controller: 'ControllerNew'
}, {
  state: 'instance.setup',
  abstract: false,
  url: '^/:userName/new/:buildId',
  templateUrl: 'viewSetup',
  controller: 'ControllerSetup'
}, {
  state: 'instance.instance',
  abstract: false,
  url: '^/:userName/:shortHash',
  templateUrl: 'viewInstance',
  controller: 'ControllerInstance'
}, {
  state: 'instance.instanceEdit',
  abstract: false,
  url: '^/:userName/:shortHash/edit/:buildId',
  templateUrl: 'viewInstanceEdit',
  controller: 'ControllerInstanceEdit'
}];
Object.freeze(module.exports);
