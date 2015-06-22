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
    return browser.wait(function () {
      return this.newContainerHeader.get().isPresent();
    });
  };

  this.selectSuggestedStackType = function () {
    return this.waitForLoaded().then(function () {
      var stackTypeSelector = new StackTypeSelector();
      stackTypeSelector.selectOption(0);
      var stackVersionSelector = new StackVersionSelector();
      var versionSelectButton = stackVersionSelector.button.get();
      expect(versionSelectButton.isPresent()).to.equal(true);
      expect(versionSelectButton.getAttribute('disabled')).to.equal('disabled');
    });
  };
}

module.exports = VerifyServerSelection;