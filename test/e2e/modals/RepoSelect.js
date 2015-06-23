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
      var count = element.all(by.css('.list-servers .list-item')).count();
      return count.then(function (count) {
        return count > 0;
      });
    }, 1000 * 10);
  };

  this.selectRepo = function (repoName) {
    var self = this;
    return this.waitForLoaded().then(function () {
      var repoItem = element(by.cssContainingText('.list-servers .list-item', repoName));
      return self.isAdded(repoItem).then(function (isAdded) {
        expect(isAdded).to.equal(false);
        return repoItem.click();
      });
    });
  };
}

module.exports = RepoSelect;