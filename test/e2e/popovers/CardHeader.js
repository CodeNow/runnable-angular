'use strict';

var util = require('../helpers/util');

function CardHeader(parentElement) {

  this.button = util.createGetter(by.css('div[pop-over-template="serverOptionsCardPopover"]'), parentElement);
  this.deleteButton = util.createGetter(by.cssContainingText('.popover .popover-list li', 'Delete Container'));

  this.isOpen = function () {
    return this.deleteButton.get().isPresent();
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

  this.selectDeleteContainer = function () {
    var self = this;
    return this.openIfClosed()
      .then(function () {
        return self.deleteButton.get().click();
      })
      .then(function () {
        return browser.sleep(500);
      });
  };
}

module.exports = CardHeader;
