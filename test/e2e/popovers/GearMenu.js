var util = require('../helpers/util');

function GearMenu () {
  this.gear = util.createGetter(by.css('#wrapper > main > header > div.secondary-actions > a'));
  this.menu = util.createGetter(by.css('#wrapper > main > header > div.secondary-actions > a > div > div.popover-content'));

  this.renameItem = util.createGetter(by.cssContainingText('#wrapper > main > header > div.secondary-actions > a > div > div.popover-content > ul > li', 'Rename Box'));
  this.forkItem = util.createGetter(by.cssContainingText('#wrapper > main > header > div.secondary-actions > a > div > div.popover-content > ul > li', 'Fork to a New Box'));
  this.deleteItem = util.createGetter(by.cssContainingText('#wrapper > main > header > div.secondary-actions > a > div > div.popover-content > ul > li', 'Delete Box'));

  this.modalRename = {
    // This works, but throws specificity warnings
    // Selecting by CSS throws other errors
    input: util.createGetter(by.model('data.instance.state.name')),
    cancel: util.createGetter(by.buttonText('Cancel')),
    rename: util.createGetter(by.buttonText('Rename Box'))
  };

  this.modalFork = {
    // This one needs to be CSS.
    // Don't ask me why
    input: util.createGetter(by.css('body > div.modal.modal-fork.ng-scope.in > div > div.modal-body > form > label > div.input-group.validate.ng-valid > span')),
    fork: util.createGetter(by.buttonText('Fork Box')),
    cancel: util.createGetter(by.buttonText('Cancel'))
  };

  this.modalDelete = util.createGetter(by.buttonText('Delete Box'));

  this.isOpen = function() {
    return this.menu.get().isDisplayed();
  };

  this.openIfClosed = function() {
    var self = this;
    return this.isOpen().then(function(isOpen) {
      if (!isOpen) {
        return self.gear.get().click();
      }
      return;
    }).then(function() {
      return browser.wait(function() {
        return self.renameItem.get().isDisplayed();
      });
    });
  };

  this.renameBox = function(newName) {
    var self = this;
    this.openIfClosed();

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
    this.openIfClosed();

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