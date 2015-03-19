'use strict';

var util = require('./helpers/util');
var users = require('./helpers/users');
var sidebar = require('./helpers/sidebar');

var InstancePage = require('./pages/InstancePage');

// RailsProject should create a MySql server
var instanceNames = ['RailsProject', 'MySQL', 'SPACESHIPS'];

describe('delete', users.doMultipleUsers(function (username) {
  // Instances that were created during e2e tests
  instanceNames.forEach(function (name, idx) {
    it('should load & delete ' + name, function () {
      var instance = new InstancePage(name);

      instance.get();

      browser.wait(function () {
        return instance.statusIcon.get().isPresent();
      });

      // Delete the instance
      instance.gearMenu.deleteBox();

      // Confirm we're on the right page
      if (idx === instanceNames.length - 1) {
        util.waitForUrl(new RegExp(username + '\/$'));
      } else {
        util.waitForUrl(InstancePage.urlRegex(username));
      }
    });
  });

  it('should confirm everything was deleted', function () {
    util.waitForUrl(new RegExp(username + '\/$'));
    expect(sidebar.numBoxes()).toEqual(0);
  });
}, true));
