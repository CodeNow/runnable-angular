module.exports = [{
  state:       'mainLayout',
  abstract:    true,
  templateUrl: 'viewLayout',
  controller:  'ControllerLayout'
}, {
  state:       'mainLayout.feed',
  abstract:    false,
  url:         '^/',
  templateUrl: 'viewFeed',
  controller:  'ControllerFeed'
}, {
  state:       'mainLayout.about',
  abstract:    false,
  url:         '^/about',
  templateUrl: 'viewAbout',
  controller:  'ControllerAbout'
}];
