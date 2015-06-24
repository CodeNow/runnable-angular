'use strict';

var util = require('../helpers/util');

function ServerCard (instanceName) {
  this.serverCardTitle = util.createGetter(by.cssContainingText('.card span', instanceName));

  this.waitForLoaded = function () {
    var self = this;
    return browser.wait(function () {
      return self.serverCardTitle.get().isPresent();
    }, 1000 * 45);
  };

  this.waitForStatusEquals = function (status) {
    var self = this;
    return self.waitForLoaded().then(function () {
      return browser.wait(function () {
        return self.serverCardTitle.get()
          .evaluate('instance.status()')
          .then(function (results) {
            console.log(results);
            return results === status;
          });
      }, 1000 * 45);
    });
  };

  //this.isOpen = function () {
  //  return this.listItems.get().count()
  //    .then(function (count) {
  //      return count > 0;
  //    });
  //};
  //
  //this.isDisabled = function () {
  //  var button = this.button.get();
  //  expect(button.isPresent()).toEqual(true);
  //  return button.isEnabled().then(function (isEnabled) {
  //    return !isEnabled;
  //  });
  //};
  //
  //this.openIfClosed = function () {
  //  var self = this;
  //  return this.isOpen()
  //    .then(function (isOpen) {
  //      if (!isOpen) {
  //        return self.button.get().click();
  //      }
  //    })
  //    .then(function () {
  //      return browser.wait(function () {
  //        return self.isOpen();
  //      }, 1000 * 2);
  //    });
  //};
  //
  //this.selectOption = function (index) {
  //  var self = this;
  //  return self.openIfClosed().then(function () {
  //    var option = self.listItems.get(index);
  //    expect(option.isPresent()).toEqual(true);
  //    return option.click();
  //  });
  //};
}

module.exports = ServerCard;