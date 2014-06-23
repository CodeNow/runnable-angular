module.exports = [{
  state:       'mainLayout',
  abstract:    true,
  templateUrl: 'viewLayout',
  controller:  'ControllerLayout',
}, {
  state:       'mainLayout.home',
  abstract:    false,
  url:         '^/',
  templateUrl: 'viewHome',
  controller:  'ControllerHome',
  data: {
    bodyClass: {
      'height-54': true
    },
  }
}, {
  state:       'mainLayout.about',
  abstract:    false,
  url:         '^/about',
  templateUrl: 'viewAbout',
  controller:  'ControllerAbout',
}, {
  state:       'mainLayout.jobs',
  abstract:    false,
  url:         '^/jobs',
  templateUrl: 'viewJobs',
  controller:  'ControllerJobs',
}, 





{
  state:       'projects',
  abstract:    true,
  templateUrl: 'viewProjectLayout',
  controller:  'ControllerProjectLayout'
}, {
  state:       'projects.buildList',
  abstract:    false,
  url:         '^/:ownerUsername/:name/:branch',
  templateUrl: 'viewBuildList',
  controller:  'ControllerBuildList',
}, {
  state:       'projects.build',
  abstract:    false,
  url:         '^/:ownerUsername/:name/:branch/:build',
  templateUrl: 'viewBuild',
  controller:  'ControllerBuild',
}, {
  state:       'projects.instance',
  abstract:    false,
  url:         '^/instance/:instanceId',
  templateUrl: 'viewInstance',
  controller:  'ControllerInstance',
}];
