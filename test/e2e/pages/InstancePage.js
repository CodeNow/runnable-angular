var util = require('../helpers/util');

var GearMenu = require('../popovers/GearMenu');
var ActivePanel = require('../directives/ActivePanel');

function InstancePage (name) {

  this.gearMenu = new GearMenu();
  this.activePanel = new ActivePanel('Instance');

  this.buildLogs = util.createGetter(by.css('#wrapper > main > section.views.with-add-tab.ng-scope > div.views-toolbar.ng-isolate-scope > ul > li.tab-wrapper.ng-scope.active > span'));
  this.statusIcon = util.createGetter(by.css('#wrapper > main > header > h1 > div > span'));
  this.instanceName = util.createGetter(by.css('#wrapper > main > header > h1 > div'));
  this.editButton = util.createGetter(by.css('#wrapper > main > header > div.secondary-actions > button'));

  this.get = function() {
    return browser.get('/runnable-doobie/' + name);
  };

  this.getName = function() {
    return this.instanceName.get().getText();
  };

  this.buildLogsOpen = function() {
    return this.buildLogs.get().isPresent();
  };
}

InstancePage.urlRegex = new RegExp(util.processUrl('/runnable-doobie/' + util.regex.instanceName));

module.exports = InstancePage;