'use strict';

require('angular');
var uiRouter = require('angular-ui-router');
var uiAce = require('angular-ui-ace');
var ngStorage = require('ngStorage');
require('ng-file-upload/dist/angular-file-upload');

module.exports = angular.module('app', [
  uiRouter,
  uiAce,
  ngStorage,
  'angularFileUpload'
]);
