/**
 * Tests a user's onboarding experience
 * setup => running instance => delete
 */

var util = require('./helpers/util');

var SetupPage = require('./pages/SetupPage');
var InstancePage = require('./pages/InstancePage');

describe('project creation workflow', function () {
  var instanceName = 'Test-0';
  it('should direct the user to the setup page', function () {
    var setup = new SetupPage();
    setup.get();
    util.waitForUrl(SetupPage.urlRegex);

    setup.setBoxName(instanceName);

    setup.repoList.openAddDropdown();

    setup.repoList.searchRepos('node-hello-world', 1);

    setup.repoList.selectRepo(0);

    setup.selectTemplate('Blank');

    browser.wait(setup.activePanel.aceLoaded.bind(setup.activePanel));
    browser.wait(setup.blankTemplateLoaded.bind(setup));

    setup.activePanel.writeToFile('\nFROM dockerfile/nodejs\nCMD sleep 1000000\n');

    browser.wait(setup.dockerfileValidates.bind(setup));
    browser.wait(setup.activePanel.isClean.bind(setup.activePanel));

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
});
