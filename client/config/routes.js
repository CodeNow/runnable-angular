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
  state:       'mainLayout.projects.buildList',
  abstract:    false,
  url:         '^/:ownerUsername/:name/:branch',
  templateUrl: 'viewBuildList',
  controller:  'ControllerBuildList',
  data: {
    header: true,
    footer: false
  }
}, {
  state:       'mainLayout.projects.build',
  abstract:    false,
  url:         '^/:ownerUsername/:name/:branch/:build',
  templateUrl: 'viewBuild',
  controller:  'ControllerBuild',
  data: {
    header: true,
    footer: false
  }
}, {
  state:       'mainLayout.projects.instance',
  abstract:    false,
  url:         '^/instance/:instanceId',
  templateUrl: 'viewInstance',
  controller:  'ControllerInstance',
  data: {
    header: true,
    footer: false
  }
}];
