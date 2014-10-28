var util = require('../helpers/util');

function ActivePanel (pageType) {
  this.pageType = pageType;

  this.activePanel = util.createGetter(by.css('#wrapper > main > section.views.with-add-tab.ng-scope > div.active-panel.ng-scope.loaded.ace-runnable-dark'));

  this.ace = util.createGetter(by.css('#wrapper > main > section.views.ng-scope > div.active-panel.ng-scope.loaded.ace-runnable-dark > pre > div.ace_scroller > div'));
  this.aceDiv = util.createGetterAll(by.css('div.ace_content'));
  this.inputElm = util.createGetterAll(by.css('textarea.ace_text-input'));

  this.activeTab = util.createGetter(by.css('#wrapper > main > section.views.with-add-tab.ng-scope > div.views-toolbar.ng-isolate-scope > ul > li.tab-wrapper.ng-scope.active > span'));
  this.tab = null;

  this.aceLoaded = function () {
    return this.ace.get().isPresent();
  };

  this.getActiveTab = function() {
    return this.activeTab.get().getText();
  };

  this.setActiveTab = function(text) {
    this.tabTitle = text;
    this.tab = element(by.cssContainingText('#wrapper > main > section.views.with-add-tab.ng-scope > div.views-toolbar.ng-isolate-scope > ul > li > span', text));
    this.tab.click();
  };

  // http://stackoverflow.com/q/25675973/1216976
  // https://github.com/angular/protractor/issues/1273
  this.writeToFile = function (contents) {
    var self = this;
    _getAceDiv.call(this).then(function(elem) {
      browser.actions().doubleClick(elem).perform();
      return _getInputElement.call(self);
    }).then(function(elem) {
      return elem.sendKeys(contents);
    });
  };

  this.clearActiveFile = function () {
    // testola
    browser.actions().doubleClick(this.aceDiv.get()).perform();
    return this.inputElm.get().clear();
  };

  this.getFileContents = function() {
    return this.ace.get().getText();
  };

  this.isClean = function () {
    return element(by.css('.box-header')).evaluate('data' + this.pageType + '.data.openItems.isClean()');
  };

  var activeIdx;
  function _getAceDiv () {
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

  function _getInputElement () {
    // currently only works for file types
    return this.inputElm.get().get(activeIdx);
  }
}

module.exports = ActivePanel;