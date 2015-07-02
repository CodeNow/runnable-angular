'use strict';

/**
 * Tests a user's ability to fork a running box
 */

var util = require('./helpers/util');
var users = require('./helpers/users');

var InstancePage = require('./pages/InstancePage');

describe('fork box', users.doMultipleUsers(function(username) {
  it('should allow the forking of a box owned by ' + username, function() {
    var instance = new InstancePage('Test-Rename');
    instance.get();

    instance.forkBox('Test-Fork');

    util.waitForUrl(util.processUrl('/' + util.getCurrentUser() + '/Test-Fork'));

    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'running');
    });
  });
}));
