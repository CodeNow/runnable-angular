var util = require('../helpers/util');

var GearMenu = require('../popovers/GearMenu');
var RepoList = require('../directives/RepoList');

function InstanceEditPage (instanceName) {
  this.gearMenu = new GearMenu();
  this.repoList = new RepoList();

  this.activePanel = util.createGetter(by.css('#wrapper > main > section.views.with-add-tab.ng-scope > div.active-panel.ng-scope.loaded.ace-runnable-dark'));
  this.discard = util.createGetter(by.buttonText('Discard Changes'));
  this.build = util.createGetter(by.buttonText('Build'));

  this.get = function() {
    // We need to create a new build each time, thus the workaround
    browser.get('/runnable-doobie/' + instanceName);
    element(by.css('#wrapper > main > header > div.secondary-actions > button')).click();
    util.waitForUrl(InstanceEditPage.urlRegex);
  };

  this.activeTabContains = function(expectedText) {
    return util.containsText(this.activePanel, expectedText);
  };

  // http://stackoverflow.com/q/25675973/1216976
  // https://github.com/angular/protractor/issues/1273
  this.addToDockerfile = function (contents) {
    var aceDiv = element(by.css('div.ace_content'));
    var inputElm = element(by.css('textarea.ace_text-input'));

    browser.actions().doubleClick(aceDiv).perform();
    return inputElm.sendKeys(contents);
  };

  this.buildChanges = function() {
    this.build.get().click();
  };
}

InstanceEditPage.urlRegex = new RegExp(util.processUrl('/runnable-doobie/' + util.regex.instanceName + '/edit/' + util.regex.objectId));

module.exports = InstanceEditPage;