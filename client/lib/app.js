var angular = require('angular');
var $ = require('jquery'); // required by brace
var brace = require('brace'); // places 'ace' prop on window object, used by angular-ui-ace
require('brace/ext/modelist');
require('./modes');
var uiRouter = require('angular-ui-router');
var uiAce = require('angular-ui-ace');

module.exports = angular.module('app', [uiRouter, uiAce]);
