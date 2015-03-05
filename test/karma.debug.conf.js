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

    //customLaunchers: customLaunchers,

    // browsers: Object.keys(customLaunchers),
    browsers: ['Chrome'],
    //browsers: ['PhantomJS'],

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

    ],


    preprocessors: {
      //'client/**/*.js': ['browserify'],
      //'unit/**/*.js': ['browserify'],
      //'../node_modules/**': ['browserify'],
      'unit/globals.js': ['browserify']
    },


    browserify: {
      watch: false,
      debug: true,
      transform: [istanbul({
        ignore: ['**/*.unit.js',  '**/test/**', '**/config/**/*.json', '**/client/**']
      })],
      extensions: ['.js']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'],


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
    autoWatch: false,
    singleRun: true

  });
};
