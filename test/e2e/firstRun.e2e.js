
/**
 * Tests a user's onboarding experience
 * login => setup => running instance
 */

var login = require('./helpers/oauth-github');
var util = require('./helpers/util');

var SetupPage = require('./pages/SetupPage');
var InstancePage = require('./pages/InstancePage');

describe('project creation workflow', function () {
  var instanceName = 'Test-0';
  it('should direct the user to the setup page', function () {
    login();

    var setup = new SetupPage();
    setup.get();
    util.waitForUrl(SetupPage.urlRegex);

    setup.setBoxName(instanceName);

    setup.repoList.openAddDropdown();

    setup.repoList.selectRepo(0);

    setup.selectBlankTemplate();

    browser.wait(setup.aceLoaded.bind(setup));
    browser.wait(setup.blankTemplateLoaded.bind(setup));

    setup.addToDockerfile('\nFROM dockerfile/nodejs\nCMD sleep 1000000\n');

    browser.wait(setup.dockerfileValidates.bind(setup));
    browser.wait(setup.dockerfileIsClean.bind(setup));

    setup.createBox();

    util.waitForUrl(InstancePage.urlRegex);
  });

  it('should load a building instance', function() {
    var instance = new InstancePage(instanceName);

    instance.get();

    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'running');
    });
  });

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
