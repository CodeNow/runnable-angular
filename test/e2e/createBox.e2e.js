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

describe('project creation workflow', function () {
  beforeEach(function () {
    return util.goToUrl('/' + browser.params.user + '/configure');
  });
  it('should create new container', function () {
    var newContainer = new NewContainer();
    var repoSelect = new RepoSelect();
    var verifyServerSelection = new VerifyServerSelection();
    return newContainer.selectRepository()
      .then(function () {
        return repoSelect.selectRepo('web');
      })
      .then(function () {
        return verifyServerSelection.selectSuggestedStackType();
      })
      .then(function () {
        return browser.driver.sleep(1000 * 5);
      });
  });
});
