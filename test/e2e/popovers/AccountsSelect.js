'use strict';

var util = require('../helpers/util');

function AccountsSelect(parentElement) {

  this.button = util.createGetter(by.className('btn-account'), parentElement);
  this.menu = util.createGetter(by.className('popover-account-menu'));

  this.isOpen = function () {
    return this.menu.get().isPresent() && this.menu.get().isDisplayed();
  };

  this.getAccountSelector = function (username) {
    return this.menu.get().element(by.cssContainingText('.popover-list-item', username));
  };

  this.openIfClosed = function () {
    var self = this;
    return this.isOpen().then(function (isOpen) {
      if (!isOpen) {
        return self.button.get().click();
      }
    }).then(function () {
      return browser.wait(function () {
        return self.menu.get().isDisplayed();
      });
    });
  };

  this.changeUser = function (username) {
    var self = this;
    return this.openIfClosed(
    ).then(function () {
      return browser.wait(function () {
        return self.getAccountSelector(username).isPresent() && self.getAccountSelector(username).isDisplayed();
      });
    }).then(function () {
      return self.getAccountSelector(username).click();
    });
  };
}

module.exports = AccountsSelect;
