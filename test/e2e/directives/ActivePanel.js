var util = require('../helpers/util');

function ActivePanel () {
  this.activePanel = util.createGetter(by.css('#wrapper > main > section.views.with-add-tab.ng-scope > div.active-panel.ng-scope.loaded.ace-runnable-dark'));

  this.ace = util.createGetter(by.css('#wrapper > main > section.views.ng-scope > div.active-panel.ng-scope.loaded.ace-runnable-dark > pre > div.ace_scroller > div'));
  // What was this for?
  this.aceComment = util.createGetter(by.css('#wrapper > main > section.views.ng-scope > div.active-panel.ng-scope.loaded.ace-runnable-dark > pre > div.ace_scroller > div > div.ace_layer.ace_text-layer > div > span'));


  this.aceLoaded = function () {
    return this.ace.get().isPresent();
  };

  // http://stackoverflow.com/q/25675973/1216976
  // https://github.com/angular/protractor/issues/1273
  this.writeToFile = function (contents) {
    var aceDiv = element(by.css('div.ace_content'));
    var inputElm = element(by.css('textarea.ace_text-input'));

    browser.actions().doubleClick(aceDiv).perform();
    return inputElm.sendKeys(contents);
  };

  this.clearActiveFile = function () {
    this.writeToFile(/* cmd + a, delete */);
  };

  this.getFileContents = function() {
    return this.ace.get().getText();
  };
}

module.exports = ActivePanel;