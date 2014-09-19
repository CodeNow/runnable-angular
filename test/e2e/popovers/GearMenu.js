var util = require('../helpers/util');

function GearMenu () {
  this.menu = util.createGetter(by.css('#wrapper > main > header > div.secondary-actions > a > div'));

  this.deleteItem = util.createGetter(by.cssContainingText('#wrapper > main > header > div.secondary-actions > a > div > div.popover-content > ul > li', 'Delete Box'));

  this.openIfClosed = function() {
    var self = this;
    return this.isOpen().then(function(isOpen) {
      if (!isOpen) {
        return self.gear.click();
      }
      return;
    });
  };

  this.isOpen = function() {
    return this.menu.get().isPresent();
  };

  this.deleteBox = function() {
    var self = this;
    return this.openIfClosed().then(function () {
      return browser.wait(function() {
        return self.deleteItem.get().isPresent();
      }).then(function() {
        return self.deleteItem.get().click();
      });
    });
  };
}

module.exports = GearMenu;