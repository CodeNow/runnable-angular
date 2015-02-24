'use strict';

var browsers = require('./browsers');

var config = {
  // Order is important
  specs: [
    'e2e/helpers/login.js',
    'e2e/createBox.e2e.js',
    // 'e2e/editDockerfile.e2e.js',
    // 'e2e/readLogs.e2e.js',
    // 'e2e/changeCommit.e2e.js',
    // 'e2e/addRepo.e2e.js',
    // 'e2e/changeCommit2Reps.e2e.js',
    // 'e2e/deleteRepo.e2e.js',
    // 'e2e/renameBox.e2e.js',
    // 'e2e/forkBox.e2e.js',
    'e2e/deleteBox.e2e.js'
  ],

  onPrepare: function () {
    browser.driver.manage().window().maximize();
    require('./e2e/helpers/capabilities');
  },

  baseUrl: 'https://sauce-web-codenow.runnableapp.com',
  allScriptsTimeout: 30000,
  getPageTimeout: 30000,
  jasmineNodeOpts: {
    showColors: true,
    isVerbose: true,
    includeStackTrace: true,
    defaultTimeoutInterval: 30000
  },

  multiCapabilities: [
    browsers.chrome
  ],

  sauceUser: 'RunnableTeam',
  sauceKey: '197a6e32-ecf7-4fd8-9c24-7aebde06de5a'
};

exports.config = config;