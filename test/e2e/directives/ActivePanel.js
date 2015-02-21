'use strict';

var util = require('../helpers/util');

function ActivePanel (pageType) {
  this.pageType = pageType;

  this.addTab = util.createGetter(by.css('.add-tab'));

  this.currentContent = util.createGetter(by.css('#wrapper > main > section.views.with-add-tab.ng-scope > div.active-panel.ng-scope.loaded.ace-runnable-dark'));

  this.ace = util.createGetter(by.css('#wrapper > main > section.views.ng-scope > div.active-panel.ng-scope.loaded.ace-runnable-dark > pre > div.ace_scroller > div'));
  this.aceDiv = util.createGetterAll(by.css('div.ace_content'));
  this.inputElm = util.createGetterAll(by.css('textarea.ace_text-input'));

  this.activeTab = util.createGetter(by.css('#wrapper > main > section.views.with-add-tab.ng-scope > div.views-toolbar.ng-isolate-scope > ul > li.tab-wrapper.ng-scope.active > span'));

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
    element(by.cssContainingText('#wrapper > main > section.views.with-add-tab.ng-scope > div:nth-child(4) > a > div > div.popover-content > ol > li', tabType)).click();
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
      browser.actions().doubleClick(elem).perform();
      return self._getInputElement();
    }).then(function(elem) {
      return elem.sendKeys(contents);
    });
  };

  this.clearActiveFile = function () {
    var self = this;
    this._getAceDiv().then(function(elem) {
      browser.actions().doubleClick(elem).perform();
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
  this.getFileContents = function() {
    return this.ace.get().getText();
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
    return this.aceDiv.get().filter(function (elem) {
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
  }

  this._getInputElement = function () {
    // currently only works for file types
    return this.inputElm.get().get(activeIdx);
  }
}

module.exports = ActivePanel;
