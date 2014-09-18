/**
 * Tests a user's onboarding experience
 * login => setup => running instance
 */

var login = require('./helpers/oauth-github');
var util = require('./helpers/util');

var SetupPage = require('./pages/SetupPage');
var InstancePage = require('./pages/InstancePage');

login();

describe('project creation workflow', function () {
  var instanceHash;
  it('should direct the user to the setup page', function () {
    var setup = new SetupPage();
    setup.get();
    util.waitForUrl(SetupPage.urlRegex);

    setup.setBoxName('test-0');

    setup.repoList.openAddDropdown();

    setup.repoList.selectFirstRepo();

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

    browser.wait(function() {
      instance.activeTabContains(/Build completed/);
    });
  });

  it('should load a running instance', function () {
    var instance = new InstancePage(instanceHash);

    instance.get();

    // Confirm it's running
    expect(util.hasClass(instance.status, 'running')).toBe(true);
    // Delete the instance
    instance.gearMenu.deleteBox();
    // Confirm we're on new page
    util.waitForUrl(SetupPage.urlRegex);
  });
});
/*
// Creation
describe('project creation workflow', function () {
  it('should allow the user to create a new project', function () {
    util.waitForUrl(new RegExp(util.processUrl('/new/' + util.regex.objectId)));
    expect(browser.getCurrentUrl()).toMatch(util.processUrl('/new'));

    element(by.model('dataProjectLayout.data.newProjectName')).sendKeys('test-0');
    element(by.css('#wrapper > header > div.startup-container > form > button')).click();

    util.waitForUrl(util.processUrl('/new/runnable-doobie/test-0'));
  });

  it('should allow the user to specify project details', function () {
    var setupPage = new SetupPage('test-0');

    setupPage.get();

    // Select GitHub repo
    setupPage.repos.filter.sendKeys('node');

    browser.wait(function () {
      return setupPage.reposLoaded();
    });

    setupPage.selectFirstRepo();

    expect(setupPage.repos.addButton.getText()).toBe('Add 1 Repository');

    setupPage.repos.addButton.click();

    // Load "Blank" template
    setupPage.selectBlankTemplate();

    browser.wait(function () {
      return setupPage.aceLoaded();
    });

    setupPage.addToDockerfile('FROM dockerfile/nodejs\nCMD sleep 1000000');

    browser.wait(function () {
      return setupPage.dockerfileIsClean();
    });

    browser.wait(function () {
      return setupPage.dockerfileValidates();
    });

    setupPage.build();

    util.waitForUrl(util.processUrl('/project/runnable-doobie/test-0/master/1'));
  });

  it('should wait for the build to complete', function () {
    browser.get('/project/runnable-doobie/test-0/master/1');

    // Extra-long timeout here because builds can take a while
    browser.wait(function () {
      return element(by.css('.sub-header')).evaluate('dataBuild.data.build.succeeded()');
    }, 60 * 1000);
  });

  it('should create a new instance', function () {
    browser.get('/project/runnable-doobie/test-0/master/1');

    browser.wait(function () {
      return element(by.css('.sub-header')).evaluate('dataBuild.data.build.succeeded()');
    });

    element(by.css('#wrapper > main > nav > section > div > button.green')).click();

    util.waitForUrl(new RegExp(util.processUrl('/instances/runnable-doobie/' + util.regex.shortHash)));

    browser.wait(function () {
      return element(by.css('.sub-header')).evaluate('dataInstance.data.container.running()');
    });
  });

  it('should allow the user to delete the project', function () {

    browser.get('/project/runnable-doobie/test-0/master');

    element(by.css('#delete-project')).click();

    browser.sleep(550).then(function () {

      element(by.css('body > div.modal.confirm.ng-scope.in > div > div.modal-footer > button:nth-child(1)')).click();

      util.waitForUrl(util.processUrl('/new'));
    });
  });
});
*/