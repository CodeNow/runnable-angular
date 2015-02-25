'use strict';

var browsers = require('./browsers');
var specs = require('./specs');

exports.config = {
  // The address of a running selenium server.
  seleniumAddress: 'http://localhost:4444/wd/hub',

  allScriptsTimeout: 20000,

  // Order is important
  specs: specs,

  onPrepare: function () {
    browser.driver.manage().window().maximize();
    require('./e2e/helpers/capabilities');
  },

  capabilities: browsers.chrome,
  baseUrl: 'http://localhost:3001',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  }
};
