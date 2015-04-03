'use strict';

var util = require('../helpers/util');

var GearMenu = require('../popovers/GearMenu');
var RepoList = require('../directives/RepoList');
var ActivePanel = require('../directives/ActivePanel');
var FileExplorer = require('../directives/FileExplorer');
var InstanceList = require('../directives/InstanceList');
var InstanceEditModal = require('./../modals/InstanceEditModal');

function InstancePage (name) {
  this.name = name;

  this.gearMenu = new GearMenu();
  this.repoList = new RepoList();
  this.activePanel = new ActivePanel('Instance');
  this.fileExplorer = new FileExplorer();
  this.instanceList = new InstanceList();

  this.statusIcon = util.createGetter(by.css('.server-name .icons-status'));
  this.instanceName = util.createGetter(by.css('.server-name'));

  this.forkButton = util.createGetter(by.buttonText('Fork'));
  this.editButton = util.createGetter(by.buttonText('Edit'));

  this.saveButton = util.createGetter(by.css('.btn-save'));
  this.saveOptions = util.createGetter(by.css('.green.btn-icon'));
  this.saveAndRestartCheckBox = util.createGetter(by.cssContainingText('.popover-list-item', 'Restart on save'));


  this.greenNotification = util.createGetter(by.css('.alert.green'));
  this.greenNotificationClose = util.createGetter(by.css('.btn-close'), this.greenNotification);

  this.modalFork = {
    // This one needs to be CSS.
    // Don't ask me why
    input: util.createGetter(by.model('items[0].opts.name')),
    forkBtn: util.createGetter(by.buttonText('Fork Server')),
    cancel: util.createGetter(by.buttonText('Go Back'))
  };

  this.modalEdit = new InstanceEditModal();


  this.closeNotificationIfPresent = function () {
    var self = this;
    if (this.greenNotification.get().isPresent()) {
      browser.wait(function () {
        return self.greenNotificationClose.get().isPresent();
      });
      self.greenNotificationClose.get().click();
    }
  };

  this.openEditModal = function () {
    var self = this;
    browser.wait(function () {
      return self.editButton.get().isPresent();
    });
    this.editButton.get().click();
    browser.wait(function () {
      return self.modalEdit.isPresent();
    });
  };

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

  this.forkBox = function (forkName) {
    var self = this;

    self.forkButton.get().click();
    browser.wait(function() {
      return self.modalFork.forkBtn.get().isDisplayed();
    });

    self.modalFork.input.get().clear();
    self.modalFork.input.get().sendKeys(forkName);
    self.modalFork.forkBtn.get().click();
  };

  this.getName = function () {
    return this.instanceName.get().getText();
  };

  this.buildLogsOpen = function () {
    return this.buildLogs.get().isPresent();
  };
}

InstancePage.urlRegex = function (username) {
  return new RegExp('\/' + (username || util.getCurrentUser()) + '\/' + util.regex.instanceName + '\/$');
};

module.exports = InstancePage;
