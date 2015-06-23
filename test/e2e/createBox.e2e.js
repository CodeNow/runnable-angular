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
    browser.get('/' + browser.params.user + '/configure');
    return util.waitForUrl(new RegExp(browser.params.user + '/configure'), 10 * 1000).then(function () {
      browser.driver.sleep(1000 * 3);
    });
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
      });
  });
});
