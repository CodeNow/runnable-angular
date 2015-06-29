'use strict';

var util = require('../helpers/util');

function RepoSelect () {
  this.nonRepoItems = util.createGetterAll(by.css('.list-servers .list-item'));
  this.search = util.createGetter(by.model('data.repoFilter'));

  this.isAdded = function (item) {
    return item.element(by.css('.disabled')).isPresent();
  };

  this.filter = function(text) {
    var searchBox = this.search.get();
    searchBox.click();
    searchBox.sendKeys(text);
  };

  this.waitForLoaded = function () {
    return browser.wait(function () {
      var count = element.all(by.css('.list-servers .list-item')).count();
      return count.then(function (count) {
        return count > 0;
      });
    }, 1000 * 20);
  };

  this.selectRepo = function (repoName) {
    var self = this;
    this.waitForLoaded()
    var repoItem = element(by.cssContainingText('.list-servers .list-item', repoName));
    expect(self.isAdded(repoItem)).toEqual(false);
    return repoItem.click();
  };
}

module.exports = RepoSelect;