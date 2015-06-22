'use strict';

var util = require('../helpers/util');

function VerifyServerSelection () {
  this.button = util.createGetter(by.cssContainingText('.placeholder', 'Select language/framework'));
  this.listItems = util.createGetterAll(by.css('fancy-select fancy-option li'));

  this.waitForLoaded = function () {
    return browser.wait(function () {
      return this.button.get().isPresent();
    });
  };

  this.isOpen = function () {
    return this.listItems.get().isPresent();
  };

  this.openIfClosed = function () {
    var self = this;
    return this.isOpen().then(function (isOpen) {
      if (!isOpen) {
        return self.button.get().click();
      }
    }).then(function () {
      return browser.wait(function () {
        return self.isOpen();
      });
    });
  };

  this.selectOption = function (index) {
    var self = this;
    return self.openIfClosed().then(function () {
      var option = self.listItems.get(index);
      expect(option.isPresent()).to.equal(true);
      option.click();
    });
  };
}

module.exports = VerifyServerSelection;