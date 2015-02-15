'use strict';

exports.config = {
  // The address of a running selenium server.
  seleniumAddress: 'http://localhost:4444/wd/hub',

  allScriptsTimeout: 20000,

  // Order is important
  specs: [
    'e2e/helpers/login.js',
    // 'e2e/createBox.e2e.js',
    //'e2e/editDockerfile.e2e.js',
    //'e2e/readLogs.e2e.js',
    'e2e/changeCommit.e2e.js',
    //'e2e/addRepo.e2e.js',
    //'e2e/changeCommit2Reps.e2e.js',
    //'e2e/deleteRepo.e2e.js',
    //'e2e/renameBox.e2e.js',
    //'e2e/forkBox.e2e.js',
    //'e2e/deleteBox.e2e.js'
  ],

  onPrepare: function () {
    browser.driver.manage().window().maximize();
    require('./e2e/helpers/capabilities');
  },

  capabilities: {
    'browserName': 'chrome'
  },
  baseUrl: 'http://localhost:3001',
  // baseUrl: 'http://runnable3.net',
  // baseUrl: 'http://runnable.io',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  }
};
