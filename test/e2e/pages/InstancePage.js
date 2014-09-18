var util = require('../helpers/util');

var GearMenu = require('../popovers/GearMenu');

function InstancePage (shortHash) {

  this.gearMenu = new GearMenu();

  this.activePanel = util.createGetter(by.css('#wrapper > main > section.views.with-add-tab.ng-scope > div.active-panel.ng-scope.loaded.ace-runnable-dark'));
  this.buildLogs = util.createGetter(by.css('#wrapper > main > section.views.with-add-tab.ng-scope > div.views-toolbar.ng-isolate-scope > ul > li.tab-wrapper.ng-scope.active > span'));
  this.statusIcon = util.createGetter(by.css('#wrapper > main > header > h1 > span'));

  this.get = function() {
    return browser.get('/runnable-doobie/' + shortHash);
  };

  this.buildLogsOpen = function() {
    return this.buildLogs.get().isPresent();
  };

  this.activePanelLoaded = function () {
    return this.activePanel.get().isPresent();
  }

  this.activeTabContains = function(expectedText) {
    return util.containsText(this.activePanel, expectedText);
  };
}

InstancePage.urlRegex = new RegExp(util.processUrl('/runnable-doobie/' + util.regex.shortHash));

module.exports = InstancePage;