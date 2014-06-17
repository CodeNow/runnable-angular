// Karma configuration
// Generated on Mon Jun 16 2014 11:48:06 GMT-0700 (PDT)

var _       = require('underscore');
var package = require('./package');
var path    = require('path');

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['commonjs', 'browserify', 'mocha'],


    commonjsPreprocessor: {
      // alias: package.browserifyAliases.reduce(function (previous, current) {
      //   current = current.split(':');
      //   previous[path.join(__dirname, current[0])] = current[1];
      //   return previous;
      // }, {})
    },


    // list of files / patterns to load in the browser
    files: [
      // 'client/main.js',
      'test/**/*.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      // 'client/main.js': ['commonjs', 'browserify'],
      'test/**/*.js': ['browserify']
    },


    browserify: {
      // alias: package.browserifyAliases.reduce(function (previous, current) {
      //   current = current.split(':');
      //   previous[path.join('./', current[0])] = current[1];
      //   console.log(previous);
      //   return previous;
      // }, {})
      transform: ['browserify-shim']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
