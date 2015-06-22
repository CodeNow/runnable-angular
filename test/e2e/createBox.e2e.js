'use strict';

/**
 * Tests a user's onboarding experience
 * setup => running instance => delete
 */

var util = require('./helpers/util');

var users = require('./helpers/users');
var NewContainer = require('./popovers/NewContainer');
var RepoSelect = require('./modals/RepoSelect');
var VerifyServerSelection = require('./modals/VerifyServerSelection');

var instances = [{
  name: 'RailsProject',
  filter: 'rails',
  env: [],
  startCommand: '/bin/sh -c rails server'
}, {
  name: 'SPACESHIPS',
  filter: 'SPACE',
  env: ['a=b', 'basd=asasdasdasd'],
  startCommand: '/bin/sh -c npm start'
}];

describe('project creation workflow', users.doMultipleUsers(function (username) {
  instances.forEach(function (instanceData) {
    beforeEach(function () {
      return util.waitForUrl(new RegExp(username+'/configure'));
    });
    it('should create new container', function () {
      var newContainer = new NewContainer();
      var repoSelect = new RepoSelect();
      var verifyServerSelection = new VerifyServerSelection();
      newContainer.selectRepository();

      repoSelect.selectRepo('web');


      verifyServerSelection.selectSuggestedStackType();

    });
  });
}, true));
