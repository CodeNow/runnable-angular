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

  maxSessions: 1,
  multiCapabilities : [
    browsers.chrome,
    browsers.testForUser(browsers.chrome)
    //browsers.firefox,
    //browsers.safari,
    //browsers.ie11,
    //browsers.ie10
  ],
  baseUrl: 'https://sauce-web-codenow.runnableapp.com',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  }
};
