'use strict';

var browsers = require('./browsers');
var specs = require('./specs');

var config = {
  // Order is important
  specs: specs,

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

  maxSessions: 1,

  sauceUser: 'RunnableTeam',
  sauceKey: '197a6e32-ecf7-4fd8-9c24-7aebde06de5a'
};

if (process.argv[3] === '--chrome') {
  config.capabilities = browsers.chrome;
} else {
  config.multiCapabilities = [
    browsers.chrome,
    browsers.firefox,
    browsers.safari,
    browsers.ie11,
    browsers.ie10
  ];
}

exports.config = config;