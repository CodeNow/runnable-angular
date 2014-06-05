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
  state:       'mainLayout.project',
  abstract:    false,
  url:         '^/project/:username/:projectid',
  templateUrl: 'viewProject',
  controller:  'ControllerProject',
  data: {
    header: true,
    footer: true
  }
}];
