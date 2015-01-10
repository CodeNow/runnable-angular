'use strict';

var util = require('./helpers/util');
var sidebar = require('./helpers/sidebar');

var InstancePage = require('./pages/InstancePage');
var SetupPage = require('./pages/SetupPage');

var instanceNames = ['Test-Rename', 'Test-Fork', 'Test-1'];

describe('delete', function() {
  // Instances that were created during e2e tests
  instanceNames.forEach(function(name, idx) {
    it('should load & delete ' + name, function () {
      var instance = new InstancePage(name);

      instance.get();

      browser.wait(function() {
        return instance.statusIcon.get().isPresent();
      });

      // Delete the instance
      instance.gearMenu.deleteBox();

      // Confirm we're on the right page
      if (idx === instanceNames.length - 1) {
        util.waitForUrl(SetupPage.urlRegex);
      } else {
        util.waitForUrl(InstancePage.urlRegex);
      }
    });
  });

  it('should confirm everything was deleted', function() {
    var setup = new SetupPage();
    setup.get();
    expect(sidebar.numBoxes()).toEqual(0);
  });
});
