'use strict';

var util = require('../helpers/util');
var CardHeader = require('../popovers/CardHeader');

function ServerCard (instanceName) {
  this.by = by.cssContainingText('.card span', instanceName);
  this.serverCardTitle = util.createGetter(this.by);

  this.getCardWrapper = function () {
    return element(this.by).element(by.xpath('../../..'));
  };

  this.waitForLoaded = function () {
    var self = this;
    return browser.wait(function () {
      return self.serverCardTitle.get().isPresent();
    }, 1000 * 45);
  };

  this.waitForStatusEquals = function (status) {
    if (typeof status === 'string') {
      status = [status];
    }
    var self = this;
    return self.waitForLoaded().then(function () {
      return browser.wait(function () {
        return self.serverCardTitle.get()
          .evaluate('instance.status()')
          .then(function (results) {
            return status.indexOf(results) > -1;
          });
      }, 1000 * 45);
    });
  };

  this.deleteContainer = function () {
    var self = this;

    var cardHeader = new CardHeader(self.getCardWrapper());
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
              return !present;
            });
        }, 1000 * 45);
      })
      .then(function () {
        return browser.waitForAngular();
      });
  };

  this.open = function (target) {
    var self = this;
    return self.waitForLoaded()
      .then(function () {
        return self.getCardWrapper()
          .element(by.cssContainingText('.card li h3', target))
          .element(by.xpath('..'))
          .click();
      });
  };

  this.getStatusText = function (target) {
    var self = this;
    return self.waitForLoaded()
      .then(function () {
        return self.getCardWrapper()
          .element(by.cssContainingText('.card li h3', target))
          .element(by.xpath('..'))
          .element(by.css('small'))
          .getText();
      });
  };
}

module.exports = ServerCard;