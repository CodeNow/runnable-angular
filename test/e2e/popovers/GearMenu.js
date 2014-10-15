var util = require('../helpers/util');

function GearMenu () {
  this.gear = util.createGetter(by.css('#wrapper > main > header > div.secondary-actions > a'));
  this.menu = util.createGetter(by.css('#wrapper > main > header > div.secondary-actions > a > div > div.popover-content'));

  this.renameItem = util.createGetter(by.cssContainingText('#wrapper > main > header > div.secondary-actions > a > div > div.popover-content > ul > li', 'Rename Box'));
  this.deleteItem = util.createGetter(by.cssContainingText('#wrapper > main > header > div.secondary-actions > a > div > div.popover-content > ul > li', 'Delete Box'));

  this.modalRename = {
    input: util.createGetter(by.model('data.instance.state.name')),
    cancel: util.createGetter(by.buttonText('Cancel')),
    rename: util.createGetter(by.buttonText('Rename Box'))
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
    });
  };

  this.renameBox = function(newName) {
    var self = this;
    this.openIfClosed();
    browser.wait(function() {
      return self.renameItem.get().isDisplayed();
    });
    self.renameItem.get().click();
    browser.wait(function() {
      return self.modalRename.input.get().isDisplayed();
    });

    self.modalRename.input.get().clear();
    self.modalRename.input.get().sendKeys(newName);
    self.modalRename.rename.get().click();
  };

  this.deleteBox = function() {
    var self = this;
    this.openIfClosed();
    browser.wait(function() {
      return self.deleteItem.get().isDisplayed();
    });
    self.deleteItem.get().click();
    browser.wait(function() {
      return self.modalDelete.get().isDisplayed();
    });
    self.modalDelete.get().click();
  };
}

module.exports = GearMenu;