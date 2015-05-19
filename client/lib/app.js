'use strict';

require('angular');
var uiRouter = require('angular-ui-router');
var uiAce = require('angular-ui-ace');
var ngStorage = require('ngStorage');
require('jsTag/jsTag/compiled/jsTag.min');
require('ng-file-upload/dist/angular-file-upload');

module.exports = angular.module('app', [
  uiRouter,
  uiAce,
  ngStorage,
  'jsTag',
  'angularFileUpload',
  require('angular-sanitize')
]);
