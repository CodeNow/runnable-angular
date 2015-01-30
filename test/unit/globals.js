'use strict';

// Variables we want everywhere

// These already modify global variables
require('colors');  // Modifies String.prototype to allow us to color
require('angular');  // Angular
require('angular-mocks');  // Mocks stuff!
require('main');  // Requires our app

// Must use window here due to Browserify's encapsulation
// jQuery is deliberately not here - we shouldn't need it to test things.
// Go learn the DOM API if you're so desperate.
window.host = require('../../client/config/json/api.json').host.toLowerCase();
if (window.host.indexOf('http') === -1) {
  window.host = 'http:' + window.host;
}
window.expect = require('chai').expect;
window.sinon = require('sinon'); // Stuff to create spyable functions
window.mocks = require('./apiMocks'); // JSON mocks for API responses
window.directiveTemplate = require('./fixtures/directiveTemplate');
window.modelStore = require('runnable/lib/stores/model-store');
window.collectionStore = require('runnable/lib/stores/collection-store');
window.fixtures = {
  MockPrimus: require('./fixtures/MockPrimus'),
  MockFetchBuild: require('./fixtures/MockFetchBuild'),
  mockFetchInstances: require('./fixtures/mockFetchInstances')
};
