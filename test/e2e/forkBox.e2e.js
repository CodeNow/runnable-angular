'use strict';

/**
 * Tests a user's ability to fork a running box
 */

var util = require('./helpers/util');

var InstancePage = require('./pages/InstancePage');

describe('fork box', function() {
  it('should allow the forking of a box', function() {
    var instance = new InstancePage('Test-Rename');
    instance.get();

    instance.gearMenu.forkBox('Test-Fork');

    util.waitForUrl(util.processUrl('/runnable-doobie/Test-Fork'));

    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'running');
    });
  });
});
