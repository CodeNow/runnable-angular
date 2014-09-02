var login = require('./login');
var SetupPage = require('./SetupPage');

function processUrl (middle) {
  return 'http://localhost:3001' + middle + '/';
}

function waitForUrl (url) {
  return browser.wait(function () {
    return browser.getCurrentUrl().then(function (currentUrl) {
      if (typeof url === 'object') {
        // It's a regex
        return url.test(currentUrl);
      }
      return currentUrl === url;
    });
  });
}

describe('home', function () {
  it('should allow navigation to /', function () {
    browser.get('/');
    browser.sleep(100);
  });
});

login();

// Creation
describe('project creation workflow', function () {
  it('should allow the user to create a new project', function () {
    waitForUrl(processUrl('/new'));
    expect(browser.getCurrentUrl()).toBe(processUrl('/new'));

    element(by.model('dataProjectLayout.data.newProjectName')).sendKeys('test-0');
    element(by.css('#wrapper > header > div.startup-container > form > button')).click();

    waitForUrl(processUrl('/new/runnable-doobie/test-0'));
  });

  it('should allow the user to specify project details', function () {
    var setupPage = new SetupPage('test-0');
    var repogroupSelector = by.css('#wrapper > main > section > ng-form > ul > li.list-group-item.ng-scope > ol > li.repo-group-item.ng-binding');

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
    // element(by.css('#editor > div.editor-container.ng-scope.loaded > pre > textarea')).sendKeys('FROM dockerfile/nodejs\nCMD sleep 1000000');

    browser.wait(function () {
      return setupPage.dockerfileValidates();
    });

    setupPage.build();

    waitForUrl(processUrl('/project/runnable-doobie/test-0/master/1'));
  });

  it('should wait for the build to complete', function () {
    browser.get('/project/runnable-doobie/test-0/master/1');

    browser.wait(function () {
      return element(by.css('.sub-header')).evaluate('dataBuild.data.build.completed()');
    });

    element(by.css('#wrapper > main > nav > section > div > button.green')).click();

    waitForUrl(new RegExp(processUrl('/instances/runnable-doobie/[a-z0-9]{6}')));
  });

  it('should allow the user to delete the project', function () {

    browser.get('/project/runnable-doobie/test-0/master');

    element(by.css('#delete-project')).click();

    browser.sleep(550).then(function () {

      element(by.css('body > div.modal.confirm.ng-scope.in > div > div.modal-footer > button:nth-child(1)')).click();

      waitForUrl(processUrl('/new'));
    });
  });
});
