exports.config = {
  // The address of a running selenium server.
  seleniumAddress: 'http://localhost:4444/wd/hub',

  allScriptsTimeout: 11000,

  // Order is important
  specs: [
    'e2e/helpers/login.js',
    'e2e/createBox.e2e.js',
    'e2e/readLogs.e2e.js',
    'e2e/changeCommit.e2e.js',
    'e2e/addRepo.e2e.js',
    'e2e/deleteRepo.e2e.js',
    'e2e/renameBox.e2e.js',
    'e2e/forkBox.e2e.js',
    'e2e/deleteBox.e2e.js'
  ],

  onPrepare: function () {
    browser.driver.manage().window().maximize();
  },

  capabilities: {
    'browserName': 'chrome'
  },

  // No trailing slash
  baseUrl: 'http://localhost:3001',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  }
};
