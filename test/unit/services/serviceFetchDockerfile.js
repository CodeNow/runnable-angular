/*global runnable:true, user:true, before:true */
'use strict';
var apiMocks = require('../apiMocks');
var instances = apiMocks.instances;
var generateUserObject = apiMocks.generateUserObject;
var generateTeammateInvitationObject = apiMocks.generateTeammateInvitationObject;
var generateGithubUserObject = apiMocks.gh.generateGithubUserObject;
var generateGithubOrgObject = apiMocks.gh.generateGithubOrgObject;

describe('serviceFetch'.bold.underline.blue, function () {
  var data;
  var res;
  var httpFactory = function ($q) {
    return function () {
      var _res = {};
      _res.args = [].slice.call(arguments);
      _res.data = data || {};
      res = _res;
      return $q.when(_res);
    };
  };

});
