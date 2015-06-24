'use strict';

var util = require('../helpers/util');
var CardHeader = require('../popovers/CardHeader');

function ServerCard (instanceName) {
  this.by = by.cssContainingText('.card span', instanceName);
  this.serverCardTitle = util.createGetter(this.by);

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

  this.deleteContainer = function () {
    var self = this;
    var cardHeader = new CardHeader(this.serverCardTitle.get().element(by.xpath('..')).element(by.xpath('..')));
    return self.waitForLoaded()
      .then(function () {
        return cardHeader.selectDeleteContainer();
      })
      .then(function () {
        return browser.switchTo().alert();
      })
      .then(function (alertDialog) {
        expect(alertDialog.getText()).toContain('Are you sure');
        return alertDialog.accept();
      })
      .then(function () {
        return browser.wait(function () {
          return element(self.by).isPresent()
            .then(function (present) {
              console.log('Is present?', present);
              return !present;
            });
        }, 1000 * 45);
      })
      .then(function () {
        return browser.waitForAngular();
      });
  };
}

module.exports = ServerCard;