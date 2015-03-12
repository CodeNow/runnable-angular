'use strict';

var util = require('../helpers/util');

var GearMenu = require('../popovers/GearMenu');
var RepoList = require('../directives/RepoList');
var ActivePanel = require('../directives/ActivePanel');
var FileExplorer = require('../directives/FileExplorer');
var InstanceList = require('../directives/InstanceList');

function InstancePage (name) {
  this.name = name;

  this.gearMenu = new GearMenu();
  this.repoList = new RepoList();
  this.activePanel = new ActivePanel('Instance');
  this.fileExplorer = new FileExplorer();
  this.instanceList = new InstanceList();

  this.statusIcon = util.createGetter(by.css('header > h1 > div > span'));
  this.instanceName = util.createGetter(by.css('#wrapper > main > header > h1 > div'));

  this.saveButton = util.createGetter(by.css('.btn-save'));
  this.saveOptions = util.createGetter(by.css('.green.btn-icon'));
  this.saveAndRestartCheckBox = util.createGetter(by.cssContainingText('.popover-list-item', 'Restart on save'));
  this.get = function () {
    return browser.get('/' + util.getCurrentUser() + '/' + this.name);
  };

  this.save = function (andRestart) {
    var self = this;
    browser.wait(function () {
      return self.saveButton.get().isPresent();
    });
    if (andRestart) {
      self.saveOptions.get().click();
      self.saveAndRestartCheckBox.get().click();
    }
    return self.saveButton.get().click();
  };

  this.getName = function () {
    return this.instanceName.get().getText();
  };

  this.buildLogsOpen = function () {
    return this.buildLogs.get().isPresent();
  };
}

InstancePage.urlRegex = function () {
  return new RegExp('\/' + util.getCurrentUser() + '\/' + util.regex.instanceName + '\/$');
};

module.exports = InstancePage;
