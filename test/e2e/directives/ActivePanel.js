'use strict';

var util = require('../helpers/util');

function ActivePanel (pageType, parent) {
  this.pageType = pageType;

  this.panel = util.createGetter(by.css('section.views'), parent);

  this.addTab = util.createGetter(by.css('.add-tab'), this.panel);

  //this.openItems = util.createGetter(by.repeater(), this.panel);

  this.currentContent = util.createGetter(by.css('div.active-panel.ace-runnable-dark:not(.ng-hide)'), this.panel);

  this.openTabs = util.createGetter(by.repeater('item in openItems.models'), this.panel);

  this.ace = util.createGetter(by.css('div.active-panel.ng-scope.ace-runnable-dark'), this.panel);
  this.aceDiv = util.createGetterAll(by.css('div.ace_content'), this.panel);
  this.inputElm = util.createGetterAll(by.css('textarea.ace_text-input'), this.panel);

  this.activeTab = util.createGetter(by.css('.tabs > .active'), this.panel);

  this.isLoaded = function() {
    return this.currentContent.get().isPresent();
  };

  this.aceLoaded = function () {
    return this.ace.get().isPresent();
  };

  this.getActiveTab = function() {
    return this.activeTab.get().getText();
  };

  this.openTab = function (tabType) {
    this.addTab.get().click();
    element(by.cssContainingText('.popover-add-tab li', tabType), this.panel).click();
  };

  this.isActiveTabDirty = function () {
    return element.all(by.css('.tab-wrapper.active.dirty')).count() > 0;
  };

  this.setActiveTab = function(text) {
    var self = this;
    this.tabTitle = text;
    var tab = element(by.cssContainingText('#wrapper > main > section.views.with-add-tab.ng-scope > div.views-toolbar.ng-isolate-scope > ul > li > span', text));
    tab.isPresent().then(function(displayed) {
      if (displayed) {
        return tab.click();
      } else {
        // This'll break when trying to open an unopened file
        return self.openTab(text);
      }
    });
  };

  // http://stackoverflow.com/q/25675973/1216976
  // https://github.com/angular/protractor/issues/1273
  this.writeToFile = function (contents) {
    var self = this;
    this._getAceDiv().then(function(elem) {
      browser.actions().click(elem).perform();
      return self._getInputElement();
    }).then(function(elem) {
      return elem.sendKeys(contents);
    });
  };


  // http://stackoverflow.com/q/25675973/1216976
  // https://github.com/angular/protractor/issues/1273
  this.addToFile = function (contentToAdd) {
    var self = this;
    this._getAceDiv().then(function(elem) {
      browser.actions().click(elem).perform();
      return self._getInputElement();
    }).then(function(elem) {
      elem.sendKeys(protractor.Key.ARROW_DOWN);
      return elem.sendKeys(contentToAdd + '\n');
    });
  };

  this.clearActiveFile = function () {
    var self = this;
    this._getAceDiv().then(function(elem) {
      browser.actions().click(elem).perform();
      return self._getInputElement();
    }).then(function(elem) {
      var cmd = util.getOSCommandKey();
      elem.sendKeys(protractor.Key.chord(cmd, "a"));
      elem.sendKeys(protractor.Key.BACK_SPACE);
      return elem.clear();
    });
  };

  // With line numbers
  this.getContents = function () {
    return this.currentContent.get().getText();
  };

  // Gets the actual contents of the file (without Ace's line numbers, etc)
  this.getFileContents = function () {
    return this._getAceDiv().then(function (elem) {
      return elem.getText();
    });
  };

  this.isClean = function () {
    return element(by.css('.box-header')).evaluate('data' + this.pageType + '.data.openItems.isClean()');
  };

  var activeIdx;
  this._getAceDiv = function () {
    // currently only works for file types
    var self = this;
    var idx = 0;
    activeIdx = 0;
    var aceDivs = this.aceDiv.get();
    if (typeof aceDivs.filter === 'function') {
      return aceDivs.filter(function (elem) {
        return elem.isDisplayed().then(function(displayed) {
          if (!displayed) {
            idx++
          } else {
            activeIdx = idx;
          }
          return displayed;
        });
      }).then(function(elems) {
        return elems[0];
      });
    } else {
      return aceDivs;
    }
  };

  this._getInputElement = function () {
    // currently only works for file types
    return this.inputElm.get(activeIdx);
  };
}

module.exports = ActivePanel;
