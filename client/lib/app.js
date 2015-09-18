'use strict';

require('angular');
require('angular-ui-router');
var ngStorage = require('ngStorage');
require('jsTag/jsTag/compiled/jsTag.min');
require('ng-file-upload/dist/ng-file-upload');
require('angular-drag-and-drop-lists/angular-drag-and-drop-lists');
require('angular-scroll');
require('angular-animate');
require('oclazyload');

module.exports = angular.module('app', [
  'ui.router',
  ngStorage,
  'jsTag',
  'ngFileUpload',
  'dndLists',
  'duScroll',
  'ngAnimate',
  require('angular-sanitize'),
  'oc.lazyLoad'
])
  .config(function ($ocLazyLoadProvider) {
    $ocLazyLoadProvider.config({
      debug: true,
      modules: [{
        name: 'ui.ace',
        files: ['/build/js/ace.js']
      }]
    });
  });
