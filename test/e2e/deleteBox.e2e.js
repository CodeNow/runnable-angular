
var util = require('./helpers/util');

var InstancePage = require('./pages/InstancePage');
var SetupPage = require('./pages/SetupPage');
var instanceName = 'Test-0';

describe('delete', function() {
  it('should load & delete a running instance', function () {
    var instance = new InstancePage(instanceName);

    instance.get();

    browser.wait(function() {
      return instance.statusIcon.get().isPresent();
    });

    // Delete the instance
    instance.gearMenu.deleteBox();

    // Confirm we're on new page
    util.waitForUrl(SetupPage.urlRegex);
  });
});