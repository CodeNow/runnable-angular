var angular  = require('angular');
var brace    = require('brace'); // places 'ace' prop on window object, used by angular-ui-ace
var uiRouter = require('angular-ui-router');
var uiAce    = require('angular-ui-ace');

module.exports = angular.module('app', [uiRouter, uiAce]);
