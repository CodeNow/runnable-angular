'use strict';

var browsers = require('./browsers');
var specs = require('./specs');

exports.config = {
  // The address of a running selenium server.
  seleniumAddress: 'http://localhost:4444/wd/hub',

  allScriptsTimeout: 1000 * 60,

  // Order is important
  specs: specs,

  onPrepare: function () {
    browser.driver.manage().window().maximize();
    require('./e2e/helpers/capabilities');
  },

  // https://github.com/angular/protractor/blob/master/docs/referenceConf.js#L223
  params: {
    user: 'runnable-doobie',
    password: 'purple4lyfe',
    org: 'runnable-test'
  },

  capabilities : browsers.chrome,
  baseUrl: 'http://localhost:3001',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 1000 * 60
  }
};
