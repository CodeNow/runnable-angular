'use strict';

var util = require('../helpers/util');

function RepoSelect () {
  this.repoItems = util.createGetterAll(by.css('.list-servers .list-item'));
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
    var self = this;
    return browser.wait(function () {
      return self.repoItems.get().count() > 0;
    });
  };

  this.selectRepo = function (repoName) {
    var self = this;
    this.waitForLoaded().then(function () {
      var repoItem = self.repoItems.get().element(by.cssContainingText('.list-item', repoName));
      expect(self.isAdded(repoItem)).to.equal(false);
      console.log('Clicking 1.');
      expect(repoItem).to.equal(false);
      return repoItem.click();
    });
  };
}

module.exports = RepoSelect;