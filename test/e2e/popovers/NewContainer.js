'use strict';

var util = require('../helpers/util');

function NewContainer(parentElement) {

  this.button = util.createGetter(by.buttonText('New Container'), parentElement);
  this.repoButton = util.createGetter(by.cssContainingText('.popover-list-item', 'Repository'));
  this.nonRepoButton = util.createGetter(by.cssContainingText('.popover-list-item', 'Non-repository'));

  this.isOpen = function () {
    return this.repoButton.get().isPresent();
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

  this.selectNonRepository = function () {
    var self = this;
    return this.openIfClosed(
    ).then(function () {
        return  self.repoButton.get().click();
      });
  };

  this.selectRepository = function () {
    var self = this;
    return this.openIfClosed(
    ).then(function () {
      return  self.repoButton.get().click();
    });
  };
}

module.exports = NewContainer;
