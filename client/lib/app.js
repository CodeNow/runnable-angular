'use strict';

require('angular');
var uiRouter = require('angular-ui-router');
var uiAce = require('angular-ui-ace');
var ngStorage = require('ngStorage');
require('jsTag/jsTag/compiled/jsTag.min');
require('ng-file-upload/dist/ng-file-upload');

module.exports = angular.module('app', [
  uiRouter,
  uiAce,
  ngStorage,
  'jsTag',
  'ngFileUpload',
  require('angular-sanitize')
]);
