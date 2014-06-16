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
    bodyClass: {
      'height-54': true
    },
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
  url:         '^/:owner/:project/:branch',
  templateUrl: 'viewBuildStream',
  controller:  'ControllerBuildStream',
  data: {
    header: true,
    bodyClass: {
      'height-108': true
    },
    footer: true
  }
}, {
  state:       'mainLayout.build',
  abstract:    false,
  url:         '^/:owner/:project/:branch/:build',
  templateUrl: 'viewBuild',
  controller:  'ControllerBuild',
  data: {
    header: true,
    bodyClass: {
      'height-54': true
    },
    footer: false
  }
}, {
  state:       'mainLayout.instance',
  abstract:    false,
  url:         '^/instance/:id',
  templateUrl: 'viewInstance',
  controller:  'ControllerInstance',
  data: {
    header: true,
    bodyClass: {
      'height-54': true
    },
    footer: false
  }
}];
