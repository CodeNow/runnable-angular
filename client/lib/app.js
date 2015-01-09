'use strict';

require('angular');
var uiRouter = require('angular-ui-router');
var uiAce = require('angular-ui-ace');
var ngStorage = require('ngStorage');

module.exports = angular.module('app', [
  uiRouter,
  uiAce,
  ngStorage
]);
