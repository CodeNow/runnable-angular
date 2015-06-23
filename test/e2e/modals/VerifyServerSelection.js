'use strict';

var util = require('../helpers/util');
var StackTypeSelector = require('../popovers/StackTypeSelector');
var StackVersionSelector = require('../popovers/StackVersionSelector');

function VerifyServerSelection () {
  this.newContainerHeader = util.createGetter(by.cssContainingText('.modal-heading', 'New Container:'));
  this.button = util.createGetter(by.cssContainingText('.placeholder', 'Select language/framework'));

  //this.isAdded = function (item) {
  //  return item.element(by.css('.disabled')).isPresent();
  //};
  //
  //this.filter = function(text) {
  //  var searchBox = this.search.get();
  //  searchBox.click();
  //  searchBox.sendKeys(text);
  //};

  this.waitForLoaded = function () {
    var self = this;
    return browser.wait(function () {
      return self.newContainerHeader.get().isPresent();
    }, 1000 * 30);
  };

  this.selectSuggestedStackType = function () {
    var stackVersionSelector = new StackVersionSelector();
    return this.waitForLoaded()
      .then(function () {
        return stackVersionSelector.button.get();
      })
      .then(function (versionSelectButton) {
        expect(versionSelectButton.isPresent()).toEqual(true);
        expect(versionSelectButton.getAttribute('disabled')).toEqual('disabled');

        var stackTypeSelector = new StackTypeSelector();
        return stackTypeSelector.selectOption(0);
      })
      .then(function () {
        return stackVersionSelector.button.get();
      })
      .then(function (versionSelectButton) {
        expect(versionSelectButton.isPresent()).toEqual(true);
        expect(versionSelectButton.getAttribute('disabled')).toEqual(undefined);
      });
  };
}

module.exports = VerifyServerSelection;