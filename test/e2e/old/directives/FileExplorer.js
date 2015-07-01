'use strict';

var util = require('../helpers/util');

function FileExplorer() {

  this.panel = util.createGetter(by.css('.explorer'));

  this.openFolder = function (folderName) {
    var panel = this.panel;
    browser.wait(function () {
      return element(by.cssContainingText('.folder', folderName), panel).isPresent() &&
          element(by.cssContainingText('.folder', folderName), panel).isDisplayed();
    });
    element.all(by.cssContainingText('.folder', folderName), panel).click();
  };
  this.openFile = function (fileName) {
    var panel = this.panel;
    browser.wait(function () {
      return element(by.cssContainingText('.file', fileName), panel).isPresent() &&
        element(by.cssContainingText('.file', fileName), panel).isDisplayed();
    });
    element.all(by.cssContainingText('.file', fileName), panel).click();
  };
}


module.exports = FileExplorer;
