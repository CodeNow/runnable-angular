'use strict';

require('angular');
require('angular-ui-router');
var ngStorage = require('ngStorage');
require('jsTag/jsTag/compiled/jsTag.min');
require('ng-file-upload/dist/ng-file-upload');
require('angular-drag-and-drop-lists/angular-drag-and-drop-lists');
require('angular-scroll');
require('angular-animate');
require('angular-modal-service');
require('oclazyload');
require('angular-clipboard');
require('angular-vs-repeat');
require('angularjs-scroll-glue');

module.exports = angular.module('app', [
  'ui.router',
  ngStorage,
  'jsTag',
  'ngFileUpload',
  'dndLists',
  'duScroll',
  'ngAnimate',
  'angularModalService',
  require('angular-sanitize'),
  'oc.lazyLoad',
  'angular-clipboard',
  require('angular-q-promisify'),
  'vs-repeat',
  'luegg.directives', // Scroll-glue
  require('angular-stripe'),
  require('angular-credit-cards')
])
  .config(function ($ocLazyLoadProvider, stripeProvider) {
    stripeProvider.setPublishableKey('my_key');
    $ocLazyLoadProvider.config({
      debug: false,
      modules: [{
        serie: true,
        name: 'ui.ace',
        files: ['https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.0/ace.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.0/ext-searchbox.js',
          'https://cdnjs.cloudflare.com/ajax/libs/ace/1.2.0/ext-modelist.js',
          '/build/js/ace.js'
        ]
      }]
    });
  });
