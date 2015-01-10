'use strict';

/**
 * Tests a user's onboarding experience
 * setup => running instance => delete
 */

var util = require('./helpers/util');

var SetupPage = require('./pages/SetupPage');
var InstancePage = require('./pages/InstancePage');
var instances = ['Test-0', 'Test-1'];
var ENV_VARS = [null, 'a=b\nbasd=asasdasdasd'];

describe('project creation workflow', function () {
  instances.forEach(function (instanceName, index) {
    describe('with' + ((ENV_VARS[index]) ? ' ' : 'out ') + 'Envs', function () {
      it('should direct the user to the setup page', function () {
        var setup = new SetupPage();
        setup.get();
        util.waitForUrl(SetupPage.urlRegex);

        setup.setBoxName(instanceName);

        setup.repoList.openAddDropdown();

        setup.repoList.searchRepos('node-hello-world', 1);

        setup.repoList.selectRepo(0);

        setup.selectTemplate('Blank');

        browser.wait(function () {
          return setup.activePanel.aceLoaded();
        });
        browser.wait(function () {
          return setup.blankTemplateLoaded();
        });

        setup.activePanel.writeToFile('\nFROM dockerfile/nodejs\nCMD sleep 123456789\n');

        browser.wait(function () {
          return setup.dockerfileValidates();
        });
        browser.wait(function () {
          return setup.activePanel.isClean();
        });

        if (ENV_VARS[index]) {
          // Now enter some envs
          setup.activePanel.openTab('Env Vars');
          browser.wait(setup.activePanel.aceLoaded.bind(setup.activePanel));

          setup.activePanel.writeToFile(ENV_VARS[index]);

          browser.wait(setup.activePanel.isClean.bind(setup.activePanel));
        }
        setup.createBox();

        util.waitForUrl(InstancePage.urlRegex);
      });

      it('should load a building instance', function () {
        var instance = new InstancePage(instanceName);

        instance.get();

        util.waitForUrl(InstancePage.urlRegex);

        browser.wait(function () {
          return util.hasClass(instance.statusIcon, 'running');
        });

        instance.activePanel.setActiveTab('Box Logs');
        browser.wait(instance.activePanel.aceLoaded.bind(instance.activePanel));

        expect(instance.activePanel.getContents()).toMatch('sleep 123456789');

        if (ENV_VARS[index]) {
          instance.activePanel.openTab('Env Vars');
          browser.wait(instance.activePanel.aceLoaded.bind(instance.activePanel));

          expect(instance.activePanel.getFileContents()).toMatch(ENV_VARS[index]);
        }
      });
    });
  });
});
