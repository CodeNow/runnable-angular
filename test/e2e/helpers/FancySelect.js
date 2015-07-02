'use strict';

var util = require('../helpers/util');

function FancySelect (buttonBy) {
  this.button = util.createGetter(buttonBy);
  this.listItems = util.createGetterAll(by.css('.fancy-select fancy-option li'));

  this.waitForLoaded = function () {
    var self = this;
    return browser.wait(function () {
      return self.button.get().isPresent();
    });
  };

  this.isOpen = function () {
    return this.listItems.get().count()
      .then(function (count) {
        return count > 0;
      });
  };

  this.isDisabled = function () {
    var button = this.button.get();
    expect(button.isPresent()).toEqual(true);
    return button.isEnabled().then(function (isEnabled) {
      return !isEnabled;
    });
  };

  this.openIfClosed = function () {
    var self = this;
    return this.isOpen()
      .then(function (isOpen) {
        if (!isOpen) {
          return self.button.get().click();
        }
      })
      .then(function () {
        return browser.wait(function () {
          return self.isOpen();
        }, 1000 * 2);
      });
  };

  this.selectOption = function (index) {
    var self = this;
    return self.openIfClosed().then(function () {
      var option = self.listItems.get(index);
      expect(option.isPresent()).toEqual(true);
      return option.click();
    });
  };

  this.selectOptionByStartsWith = function (str) {
    return this.openIfClosed().then(function () {
      return element(by.cssContainingText('.fancy-select fancy-option li span', str))
        .element(by.xpath('..'))
        .click();
    });
  };
}

module.exports = FancySelect;