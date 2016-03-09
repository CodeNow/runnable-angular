'use strict';

require('es5-shim');
// Variables we want everywhere

// These already modify global variables
require('colors');  // Modifies String.prototype to allow us to color
require('angular');  // Angular
require('angular-mocks');  // Mocks stuff!
require('main');  // Requires our app

require('es6-symbol/implement');

// Must use window here due to Browserify's encapsulation
window.host = require('../../client/config/json/api.json').host.toLowerCase();
window.userContentDomain = require('../../client/config/json/api.json').userContentDomain.toLowerCase();

window.testingMode = true;

window.runnable = new (require('@runnable/api-client'))(window.host, {
  socket: true,
  warn: false,
  requestDefaults: {
    testing: true
  },
  host: '//example.com',
  userContentDomain: window.userContentDomain
});

Error.prototype.stack = 'Phantom does not have stack support on errors.';


var chai = require('chai');
chai.use(require('chai-as-promised'));
window.expect = chai.expect;
window.sinon = require('sinon'); // Stuff to create spyable functions
window.mocks = require('./apiMocks'); // JSON mocks for API responses
window.directiveTemplate = require('./fixtures/directiveTemplate');
window.modelStore = require('@runnable/api-client/lib/stores/model-store');
window.collectionStore = require('@runnable/api-client/lib/stores/collection-store');
window.fixtures = {
  MockPrimus: require('./fixtures/MockPrimus'),
  MockFetchBuild: require('./fixtures/MockFetchBuild'),
  mockFetchInstances: require('./fixtures/MockFetchInstances'),
  mockFetchUser: require('./fixtures/mockFetchUser'),
  mockFetchOwnerRepos: require('./fixtures/mockFetchOwnerRepos')
  //mockFetch: require('./fixtures/mockFetch')
};

window.apiClientMockFactory = require('../unit/apiMocks/apiClientMockFactory');
window.helpCardsMock = require('../unit/apiMocks/HelpCardServiceMock');
window.noop = function () {};
window.helpers = {
  click: function (el, augmentCb){
    var event = document.createEvent('MouseEvent');
    event.initMouseEvent(
      'click',
      true /* bubble */, true /* cancelable */,
      window, null,
      0, 0, 0, 0, /* coordinates */
      false, false, false, false, /* modifier keys */
      0 /*left*/, null
    );
    if (augmentCb) {
      augmentCb(event);
    }
    el.dispatchEvent(event);
  },
  rightClick: function (el, augmentCb) {
    var event = document.createEvent('HTMLEvents');
    event.initEvent('contextmenu', true, false);
    event.pageY = 10;
    event.pageX = 10;
    if (augmentCb) {
      augmentCb(event);
    }
    el.dispatchEvent(event);
  },
  hover: function (el, augmentCb) {
    var event = document.createEvent('MouseEvent');
    event.initMouseEvent(
      'mouseover',
      true /* bubble */, false /* cancelable */,
      window, null,
      0, 0, 0, 0, /* coordinates */
      false, false, false, false, /* modifier keys */
      null /*left*/, null
    );
    if (augmentCb) {
      augmentCb(event);
    }
    el.dispatchEvent(event);
  },
  mouseleave: function (el, augmentCb) {
    var event = document.createEvent('MouseEvent');
    event.initMouseEvent(
      'mouseout',
      true /* bubble */, false /* cancelable */,
      window, null,
      0, 0, 0, 0, /* coordinates */
      false, false, false, false, /* modifier keys */
      null /*left*/, null
    );
    if (augmentCb) {
      augmentCb(event);
    }
    el.dispatchEvent(event);
  }
};
