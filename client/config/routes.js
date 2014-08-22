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
  state: 'about',
  abstract: false,
  url: '^/about',
  templateUrl: 'viewAbout',
  controller: 'ControllerAbout'
}, {
  state: 'jobs',
  abstract: false,
  url: '^/jobs',
  templateUrl: 'viewJobs',
  controller: 'ControllerJobs'
}, {
  state: 'projects',
  abstract: false,
  url: '^/new',
  templateUrl: 'viewProjectLayout',
  controller: 'ControllerProjectLayout'
}, {
  state: 'projects.setup',
  abstract: false,
  url: '^/new/:userName/:projectName',
  templateUrl: 'viewSetup',
  controller: 'ControllerSetup',
  data: {
    bodyClass: {
      setup: true
    },
  }
}, {
  state: 'projects.buildList',
  abstract: false,
  url: '^/project/:userName/:projectName/:branchName',
  templateUrl: 'viewBuildList',
  controller: 'ControllerBuildList'
}, {
  state: 'projects.build',
  abstract: false,
  url: '^/project/:userName/:projectName/:branchName/:buildName',
  templateUrl: 'viewBuild',
  controller: 'ControllerBuild'
}, {
  state: 'projects.buildNew',
  abstract: false,
  url: '^/project/:userName/:projectName/:branchName/:buildName/edit/:newBuildName',
  templateUrl: 'viewBuildNew',
  controller: 'ControllerBuildNew'
}, {
  state: 'projects.instance',
  abstract: false,
  url: '^/instances/:userName/:instanceId',
  templateUrl: 'viewInstance',
  controller: 'ControllerInstance'
}, {
  state: '404',
  abstract: false,
  templateUrl: 'viewError',
  controller: 'ControllerError'
}];
Object.freeze(module.exports);
