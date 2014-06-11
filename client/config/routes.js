module.exports = [{
  state:       'mainLayout',
  abstract:    true,
  templateUrl: 'viewLayout',
  controller:  'ControllerLayout',
  data: {
    header: true,
    footer: true
  }
}, {
  state:       'mainLayout.home',
  abstract:    false,
  url:         '^/',
  templateUrl: 'viewHome',
  controller:  'ControllerHome',
  data: {
    header: false,
    footer: true
  }
}, {
  state:       'mainLayout.about',
  abstract:    false,
  url:         '^/about',
  templateUrl: 'viewAbout',
  controller:  'ControllerAbout',
  data: {
    header: true,
    footer: true
  }
}, {
  state:       'mainLayout.jobs',
  abstract:    false,
  url:         '^/jobs',
  templateUrl: 'viewJobs',
  controller:  'ControllerJobs',
  data: {
    header: true,
    footer: true
  }
}, {
  state:       'mainLayout.buildStream',
  abstract:    false,
  url:         '^/:userOrOrg/:project/:branch',
  templateUrl: 'viewBuildStream',
  controller:  'ControllerBuildStream',
  data: {
    header: true,
    footer: true
  }
}, {
  state:       'mainLayout.build',
  abstract:    false,
  url:         '^/:userOrOrg/:project/:branch/:build',
  templateUrl: 'viewBuild',
  controller:  'ControllerBuild',
  data: {
    header: true,
    footer: true
  }
}];
