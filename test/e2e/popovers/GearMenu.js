'use strict';

var util = require('../helpers/util');

function GearMenu() {
  this.gear = util.createGetter(by.css('.btn-icon.btn-action'));
  this.menu = util.createGetter(by.css('.popover-actions'));

  this.stopRunning = util.createGetter(by.cssContainingText('ul > li', 'Stop Running'), this.menu);
  this.renameItem = util.createGetter(by.cssContainingText('ul > li', 'Rename Server'), this.menu);
  this.deleteItem = util.createGetter(by.cssContainingText('ul > li', 'Delete Server'), this.menu);

  this.modalRename = {
    // This works, but throws specificity warnings
    // Selecting by CSS throws other errors
    input: util.createGetter(by.model('data.newName')),
    cancel: util.createGetter(by.buttonText('Go Back')),
    rename: util.createGetter(by.buttonText('Rename Server'))
  };

  this.modalFork = {
    // This one needs to be CSS.
    // Don't ask me why
    input: util.createGetter(by.model('data.newForkName')),
    cancel: util.createGetter(by.buttonText('Go Back'))
  };

  this.modalDelete = util.createGetter(by.buttonText('Delete Server'));

  this.isOpen = function() {
    return this.menu.get().isPresent() && this.menu.get().isDisplayed();
  };

  this.openIfClosed = function() {
    var self = this;
    return this.isOpen().then(function(isOpen) {
      if (!isOpen) {
        return self.gear.get().click();
      }
    }).then(function() {
      return browser.wait(function() {
        return self.renameItem.get().isDisplayed();
      });
    });
  };

  this.renameBox = function(newName) {
    var self = this;
    self.openIfClosed();

    self.renameItem.get().click();
    browser.wait(function() {
      return self.modalRename.input.get().isDisplayed();
    });

    self.modalRename.input.get().clear();
    self.modalRename.input.get().sendKeys(newName);
    self.modalRename.rename.get().click();
  };

  this.forkBox = function (forkName) {
    var self = this;
    self.forkItem.get().click();
    browser.wait(function() {
      return self.modalFork.fork.get().isDisplayed();
    });

    self.modalFork.input.get().clear();
    self.modalFork.input.get().sendKeys(forkName);
    self.modalFork.fork.get().click();
  };

  this.deleteBox = function() {
    var self = this;
    this.openIfClosed();

    self.deleteItem.get().click();
    browser.wait(function() {
      return self.modalDelete.get().isDisplayed();
    });
    self.modalDelete.get().click();
  };
}

module.exports = GearMenu;
