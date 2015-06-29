'use strict';

var util = require('../../helpers/util');
var FancySelect = require('../../helpers/FancySelect');

function FindAndReplace(modal) {
  var wrappingElement = util.createGetter(by.css('div[ng-include="\'translationRulesTableForm\'"]'));

  this.addStringRule =  function (find, server, options) {
    options = options || {};
    options.start = options.start || '';
    options.end = options.end || '';
    modal.waitForLoaded();

    modal.goTo('Find and Replace');
    wrappingElement.get().element(by.cssContainingText('button.btn', 'New String Rule')).click();
    element(by.css('.popover-rules input[name="fromTextBox"]')).sendKeys(find);

    new FancySelect(by.css('button[title="Show list of hostnames"]'))
      .selectOptionByStartsWith(server+'-staging');
    element(by.css('.popover-rules input[name="toTextBox"]'))
      .sendKeys(
        protractor.Key.HOME,
        protractor.Key.NULL,
        options.start,
        protractor.Key.END,
        protractor.Key.NULL,
        options.end
      );
    element(by.buttonText('Search for matches')).click();
    element(by.buttonText('Create Rule')).click();
  };
}

module.exports = FindAndReplace;