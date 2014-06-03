module.exports = [{
  state:       'main',
  abstract:    true,
  templateUrl: 'viewLayout',
  controller:  'ControllerLayout'
}, {
  state:       'main.feed',
  abstract:    false,
  url:         '^/',
  templateUrl: 'viewFeed',
  controller:  'ControllerFeed'
}, {
  state:       'main.about',
  abstract:    false,
  url:         '^/about',
  templateUrl: 'viewAbout',
  controller:  'ControllerAbout'
}];
