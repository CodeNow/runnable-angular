// Karma configuration
// Generated on Mon Jun 16 2014 11:48:06 GMT-0700 (PDT)

var _       = require('underscore');
var package = require('../package');
var path    = require('path');

var customLaunchers = {
  sl_chrome: {
    base:        'SauceLabs',
    browserName: 'chrome',
    platform:    'Windows 7'
  },
  sl_firefox: {
    base:        'SauceLabs',
    browserName: 'firefox',
    version:     '27'
  },
  sl_ios_safari: {
    base:        'SauceLabs',
    browserName: 'iphone',
    platform:    'OS X 10.9',
    version:     '7.1'
  },
  sl_ie_11: {
    base:        'SauceLabs',
    browserName: 'internet explorer',
    platform:    'Windows 8.1',
    version:     '11'
  }
};

module.exports = function(config) {
  config.set({

    sauceLabs: {
      testName: 'Runnable 2.0'
    },

    customLaunchers: customLaunchers,

    // browsers: Object.keys(customLaunchers),
    browsers: ['Chrome'],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'mocha'],



    // list of files / patterns to load in the browser
    files: [
      // 'client/main.js',
      'unit/**/*.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'unit/**/*.js': ['browserify']
    },


    browserify: {
      transform: ['browserify-shim']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['saucelabs', 'mocha'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    // browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
