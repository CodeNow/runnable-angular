var util = require('../helpers/util');

function GearMenu () {
  this.gear = util.createGetter(by.css('#wrapper > main > header > div.secondary-actions > a'));
  this.menu = util.createGetter(by.css('#wrapper > main > header > div.secondary-actions > a > div > div.popover-content'));

  this.deleteItem = util.createGetter(by.cssContainingText('#wrapper > main > header > div.secondary-actions > a > div > div.popover-content > ul > li', 'Delete Box'));

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

  this.deleteBox = function() {
    var self = this;
    return this.openIfClosed().then(function () {
      return browser.wait(function() {
        return self.deleteItem.get().isDisplayed();
      }).then(function() {
        return self.deleteItem.get().click();
      }).then(function() {
        return self.modalDelete.get().click();
      });
    });
  };
}

module.exports = GearMenu;