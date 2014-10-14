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

{
  state: 'home1',
  abstract: false,
  url: '^/home1',
  templateUrl: 'viewHome',
  controller: 'ControllerHome',
  data: {
    bodyClass: {
      'landing': true
    },
  }
}, 

{
  state: 'home2',
  abstract: false,
  url: '^/home2',
  templateUrl: 'viewHome1',
  controller: 'ControllerHome',
  data: {
    bodyClass: {
      'landing': true
    },
  }
}, 

{
  state: 'home3',
  abstract: false,
  url: '^/home3',
  templateUrl: 'viewHome2',
  controller: 'ControllerHome',
  data: {
    bodyClass: {
      'landing': true
    },
  }
}, 

{
  state: 'home4',
  abstract: false,
  url: '^/home4',
  templateUrl: 'viewHome3',
  controller: 'ControllerHome',
  data: {
    bodyClass: {
      'landing': true
    },
  }
}, 

{
  state: 'home5',
  abstract: false,
  url: '^/home5',
  templateUrl: 'viewHome5',
  controller: 'ControllerHome',
  data: {
    bodyClass: {
      'landing': true
    },
  }
}, 

{
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
}];
Object.freeze(module.exports);
