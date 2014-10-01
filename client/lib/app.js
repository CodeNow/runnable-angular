var angular = require('angular');
var $ = require('jquery'); // required by brace
var brace = require('brace'); // places 'ace' prop on window object, used by angular-ui-ace
require('brace/ext/modelist');
require('brace/ext/searchbox');
require('./modes');
var uiRouter = require('angular-ui-router');
var uiAce = require('angular-ui-ace');
var ngStorage = require('ngStorage');

module.exports = angular.module('app', [uiRouter, uiAce, ngStorage]);
