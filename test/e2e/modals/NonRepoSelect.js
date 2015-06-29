'use strict';

var util = require('../helpers/util');

function NonRepoSelect () {
  this.isAdded = function (item) {
    return item.element(by.css('.disabled')).isPresent();
  };

  this.waitForLoaded = function () {
    var self = this;
    return browser.wait(function () {
      var count = element.all(by.css('.list-servers .list-item')).count();
      return count.then(function (count) {
        return count > 0;
      });
    }, 1000 * 20);
  };

  this.selectNonRepo = function (repoName) {
    var self = this;
    this.waitForLoaded();
    var repoItem = element(by.cssContainingText('.list-servers .list-item', repoName));
    expect(self.isAdded(repoItem)).toEqual(false);
    return repoItem.click();
  };
}

module.exports = NonRepoSelect;