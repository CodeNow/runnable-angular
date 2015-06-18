'use strict';

// Karma configuration

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
      },
      captureConsole: true
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
        ignore: ['**/node_modules/**', '**/*.unit.js',  '**/test/**', '**/config/**/*.json']
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
        { type: 'text', subdir: '.', file: 'text.txt' },
        { type: 'json', subdir: '.', file: 'coverage.json' },
        { type: 'html', subdir: 'html' }
      ]
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_ERROR,
    logList: [{
      type: 'console'
    }],


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,
    autoWatchBatchDelay: 2000,


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
