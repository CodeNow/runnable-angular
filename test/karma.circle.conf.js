'use strict';

// Karma configuration
// Generated on Mon Jun 16 2014 11:48:06 GMT-0700 (PDT)

var istanbul = require('browserify-istanbul');

module.exports = function(config) {
  config.set({

    browserDisconnectTimeout: 100000,
    browserDisconnectTolerance: 50,
    browserNoActivityTimeout: 100000,

    sauceLabs: {
      testName: 'Runnable 2.0'
    },

    // browsers: ['Chrome'],
    browsers: ['PhantomJS'],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'mocha'],

    client: {
      mocha: {
        ui: 'bdd'
      }
    },

    // list of files / patterns to load in the browser
    files: [
      'unit/globals.js',
      'unit/**/*.unit.js'
    ],


    // list of files to exclude
    exclude: [
      //'../client/**/*.json'
    ],


    preprocessors: {
      'unit/**/*.js': ['browserify'],
      'client/**/*.js': ['coverage']
    },

    browserify: {
      debug: true,
      transform: [istanbul({
        ignore: ['**/node_modules/**', '**/*.unit.js',  '**/test/**', '**/config/**/*.json', '**/client/assets/**', '**/client/build/**', '**/client/lib/**', '**/client/polyfills/**']
      })],
      extensions: ['.js']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['saucelabs', 'mocha', 'coverage'],

    coverageReporter: {
      type: 'json',
      dir : 'coverage',
      reporters: [
        { type: 'text-summary', subdir: '.'},
        { type: 'json', subdir: '.', file: 'coverage.json' },
        { type: 'html', subdir: 'html' }
      ]
    },

    // web server port
    port: 9876,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_ERROR,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
};
