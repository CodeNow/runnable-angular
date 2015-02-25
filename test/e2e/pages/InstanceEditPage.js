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

  this.buildOptions = util.createGetter(by.css('.primary-actions > .btn-group > .orange.btn-icon'));
  this.buildWithoutCacheButton = util.createGetter(by.cssContainingText('.popover-list-item', 'Build without cache'));


  this.get = function () {
    // We need to create a new build each time, thus the workaround
    browser.get('/' + util.getCurrentUser() + '/' + instanceName);
    element(by.cssContainingText('.btn-action', 'Edit')).click();
    util.waitForUrl(InstanceEditPage.urlRegex());
  };

  this.buildChanges = function () {
    this.build.get().click();
  };

  this.buildWithoutCache = function () {
    var self = this;
    this.buildOptions.get().click();
    return browser.wait(function () {
      return self.buildWithoutCacheButton.get().isPresent();
    }).then(function () {
      return self.buildWithoutCacheButton.get().click();
    });
  };
}

InstanceEditPage.urlRegex = function () {
  return new RegExp(util.processUrl('/' + util.getCurrentUser() + '/' + util.regex.instanceName + '/edit/' + util.regex.objectId));
};

module.exports = InstanceEditPage;
