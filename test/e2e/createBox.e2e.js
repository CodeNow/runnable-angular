/**
 * Tests a user's onboarding experience
 * setup => running instance => delete
 */

var util = require('./helpers/util');

var SetupPage = require('./pages/SetupPage');
var InstancePage = require('./pages/InstancePage');

var ENV_VARS = 'a=b\nbasd=asasdasdasd';

describe('project creation workflow, no envs', function () {
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

    setup.activePanel.writeToFile('\nFROM dockerfile/nodejs\nCMD sleep 123456789\n');

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

    instance.activePanel.setActiveTab('Box Logs');

    expect(instance.activePanel.getContents()).toMatch('sleep 123456789');
  });
});
describe('project creation workflow, with envs', function () {
  var instanceName = 'Test-1';
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

    setup.activePanel.writeToFile('\nFROM dockerfile/nodejs\nCMD sleep 123456789\n');

    browser.wait(setup.activePanel.isClean.bind(setup.activePanel));

    // Now enter some envs
    setup.activePanel.openTab('Env Vars');
    browser.wait(setup.activePanel.aceLoaded.bind(setup.activePanel));

    setup.activePanel.writeToFile(ENV_VARS);

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

    instance.activePanel.setActiveTab('Box Logs');

    expect(instance.activePanel.getContents()).toMatch('sleep 123456789');
    instance.activePanel.openTab('Env Vars');
    browser.wait(instance.activePanel.aceLoaded.bind(instance.activePanel));

    expect(instance.activePanel.getContents()).toMatch(ENV_VARS);
  });
});
