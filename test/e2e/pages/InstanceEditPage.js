'use strict';

var util = require('../helpers/util');

var GearMenu = require('../popovers/GearMenu');
var RepoList = require('../directives/RepoList');
var ActivePanel = require('../directives/ActivePanel');

function InstanceEditPage (instanceName) {
  this.gearMenu = new GearMenu();
  this.repoList = new RepoList();
  this.activePanel = new ActivePanel('InstanceEdit');

  this.discard = util.createGetter(by.buttonText('Discard Changes'));
  this.build = util.createGetter(by.buttonText('Build'));

  this.get = function() {
    // We need to create a new build each time, thus the workaround
    browser.get('/runnable-doobie/' + instanceName);
    element(by.css('#wrapper > main > header > div.secondary-actions.ng-scope > button:nth-child(2)')).click();
    util.waitForUrl(InstanceEditPage.urlRegex);
  };

  this.buildChanges = function() {
    this.build.get().click();
  };
}

InstanceEditPage.urlRegex = new RegExp(util.processUrl('/runnable-doobie/' + util.regex.instanceName + '/edit/' + util.regex.objectId));

module.exports = InstanceEditPage;
