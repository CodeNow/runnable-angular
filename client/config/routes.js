module.exports = [{
  state:       'home',
  abstract:    false,
  url:         '^/',
  templateUrl: 'viewHome',
  controller:  'ControllerHome',
  data: {
    bodyClass: {
      'width-full': true
    },
  }
}, {
  state:       'about',
  abstract:    false,
  url:         '^/about',
  templateUrl: 'viewAbout',
  controller:  'ControllerAbout',
}, {
  state:       'jobs',
  abstract:    false,
  url:         '^/jobs',
  templateUrl: 'viewJobs',
  controller:  'ControllerJobs',
}, {
  state:       'projects',
  abstract:    true,
  templateUrl: 'viewProjectLayout',
  controller:  'ControllerProjectLayout'
}, {
  state:       'projects.buildList',
  abstract:    false,
  url:         '^/:userName/:projectName/:branchName',
  templateUrl: 'viewBuildList',
  controller:  'ControllerBuildList',
}, {
  state:       'projects.build',
  abstract:    false,
  url:         '^/:userName/:projectName/:branchName/:buildName',
  templateUrl: 'viewBuild',
  controller:  'ControllerBuild',
}, {
  state:       'projects.instance',
  abstract:    false,
  url:         '^/:userName/:projectName/:branchName/:buildName/:instanceId',
  templateUrl: 'viewInstance',
  controller:  'ControllerInstance',
}, {
  state:       '404',
  abstract:    false,
  templateUrl: 'viewError',
  controller:  'ControllerError'
}];
Object.freeze(module.exports);
