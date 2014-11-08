// Variables we want everywhere

// These already modify global variables
require('colors');  // Modifies String.prototype to allow us to color
require('angular');  // Angular
require('browserify-angular-mocks');  // Mocks stuff!
require('main');  // Requires our app

// Must use window here due to Browserify's encapsulation
// jQuery is deliberately not here - we shouldn't need it to test things.
// Go learn the DOM API if you're so desperate.
window.host = require('../../client/config/json/api.json').host;
window.expect = require('chai').expect;
window.sinon = require('sinon'); // Stuff to create spyable functions (unused)
window.mocks = require('./apiMocks'); // JSON mocks for API responses
window.directiveTemplate = require('./fixtures/directiveTemplate');



// Still not sure about keeping this one in
// It's not used in every test, but extra calls don't break anything.
var modelStore = require('runnable/lib/stores/model-store');

beforeEach(function () {
  modelStore.reset();
});