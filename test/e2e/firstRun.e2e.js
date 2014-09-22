
/**
 * Tests a user's onboarding experience
 * login => setup => running instance
 */

var login = require('./helpers/oauth-github');
var util = require('./helpers/util');

var SetupPage = require('./pages/SetupPage');
var InstancePage = require('./pages/InstancePage');

describe('project creation workflow', function () {
  var instanceHash;
  it('should direct the user to the setup page', function () {
    login();

    var setup = new SetupPage();
    setup.get();
    util.waitForUrl(SetupPage.urlRegex);

    setup.setBoxName('test-0');

    setup.repoList.openAddDropdown();

    setup.repoList.selectRepo(0);

    browser.wait(function() {
      return setup.repoList.numSelectedRepos().then(function(numRepos) {
        return numRepos === 1;
      });
    });

    setup.selectBlankTemplate();

    browser.wait(setup.aceLoaded.bind(setup));
    browser.wait(setup.blankTemplateLoaded.bind(setup));

    setup.addToDockerfile('\nFROM dockerfile/nodejs\nCMD sleep 1000000\n');

    browser.wait(setup.dockerfileValidates.bind(setup));
    browser.wait(setup.dockerfileIsClean.bind(setup));

    setup.createBox();

    util.waitForUrl(InstancePage.urlRegex);

    browser.getCurrentUrl().then(function(url) {
      var results = new RegExp(util.regex.shortHash + '/$').exec(url);

      if (results && results.length) {
        instanceHash = results[0].replace('/', '');
      } else {
        throw new Error('Could not load instance page ' + url);
      }
    });
  });

  it('should load a building instance', function() {
    var instance = new InstancePage(instanceHash);

    instance.get();

    browser.wait(instance.buildLogsOpen.bind(instance));
    browser.wait(instance.activePanelLoaded.bind(instance));

    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'running');
    });
  });

  it('should load & delete a running instance', function () {
    var instance = new InstancePage(instanceHash);

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
