'use strict';

var util = require('../helpers/util');

function VerifyServerSelection () {
  this.button = util.createGetter(by.cssContainingText('.placeholder', 'Select Version'));
  this.listItems = util.createGetterAll(by.css('fancy-select fancy-option li'));

  this.waitForLoaded = function () {
    var self = this;
    return browser.wait(function () {
      return self.button.get().isPresent();
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
      self.listItems.get(index).then(function (option) {
        expect(option.isPresent()).toEqual(true);
        return option.click();
      });
    });
  };
}

module.exports = VerifyServerSelection;