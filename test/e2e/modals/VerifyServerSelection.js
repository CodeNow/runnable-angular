'use strict';

var util = require('../helpers/util');
var FancySelect = require('../helpers/FancySelect');

function VerifyServerSelection () {
  this.newContainerHeader = util.createGetter(by.cssContainingText('.modal-heading', 'New Container:'));
  this.buildCommandsButton = util.createGetter(by.model('state.commands'));
  this.createContainerButton = util.createGetter(by.buttonText('Create Container'));

  var stackTypeSelector = new FancySelect(by.css('button[placeholder^="Select language/framework"]'));
  var stackVersionSelector = new FancySelect(by.css('button[placeholder^="Select Version"]'));
  var containerCommandSelector = new FancySelect(by.css('input[placeholder^="Container command"]'));

  this.waitForLoaded = function () {
    var self = this;
    return browser.wait(function () {
      return self.newContainerHeader.get().isPresent();
    }, 1000 * 30 * 1000);
  };

  this.selectSuggestedStackType = function (options) {
    options = options || {};
    options.firstTime = options.firstTime || false;

    this.waitForLoaded();
    expect(stackVersionSelector.isDisabled()).toBe(options.firstTime);
    stackTypeSelector.selectOption(0);
    return expect(stackVersionSelector.isDisabled()).toBe(false);
  };

  this.selectSuggestedVersion = function () {
    this.waitForLoaded();
    expect(stackVersionSelector.isDisabled()).toBe(false);
    return stackVersionSelector.selectOption(0);
  };

  this.getBuildCommands = function () {
    return this.buildCommandsButton.get().getAttribute('value');
  };

  this.selectSuggestedContainerCommand = function () {
    this.waitForLoaded();
    expect(containerCommandSelector.isDisabled()).toBe(false);
    return containerCommandSelector.selectOption(0);
  };

}

module.exports = VerifyServerSelection;