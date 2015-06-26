'use strict';

var util = require('../helpers/util');

function HelpCards () {
  var moreHelpButton = util.createGetter(by.cssContainingText('button','More Help'));

  this.selectCardByText = function (cardText) {
    var helpCardButtonText = util.createGetter(by.cssContainingText('.triggered-help-item p', cardText));
    var helpCardButton;

    return browser.wait(function () {
      return moreHelpButton.get().isPresent();
    }, 1000 * 30 * 1000)
      .then(function () {
        moreHelpButton.get().click();
        return browser.wait(function () {
          return helpCardButtonText.get().isPresent();
        }, 1000 * 30 * 1000);
      })
      .then(function () {
        helpCardButton = helpCardButtonText.get().element(by.xpath('following-sibling::button'));
        return helpCardButton.click();
      })
      .then(function () {
        // Verify help text shows up and new container button gets a class
        return helpCardButton.isPresent()
          .then(function (isPresent) {
            expect(isPresent).toEqual(false);
          });
      });
  };
}

module.exports = HelpCards;