'use strict';

var util = require('../helpers/util');

function GithubCommitMenu(repo) {
  var self = this;
  this.repo = repo;
  this.commitInfo = util.createGetter(by.className('js-repository-commit'), repo);
  this.branchInfo = util.createGetter(by.className('js-repository-branch'), repo);

  // Commit popover menu
  this.commitMenu = util.createGetter(by.className('popover-repository-toggle'));
  this.commitList = util.createGetterAll(by.repeater('commit in data.activeBranch.commits.models'));

  this.branchSelector = util.createGetter(by.className('select'), this.commitMenu);

  this.open = function () {
    browser.wait(repo.isDisplayed);
    repo.click();
    browser.wait(function () {
      return self.commitMenu.get().isPresent();
    });
    browser.wait(self.isOpen);
  };

  this.isOpen = function () {
    return self.commitList.get().first().isDisplayed();
  };

  this.changeCommit = function (index) {

    var commit = self.commitList.get(index);
    return commit.click();
  };

  this.changeBranch = function (branchName, commitIndex) {
    browser.wait(function () {
      return self.branchSelector.get().isDisplayed();
    });
    this.branchSelector.get().click();
    var testBranch = this.branchSelector.get().element(by.cssContainingText('option', branchName));
    testBranch.click();
    browser.wait(function () {
      return self.getSelectedBranch().getText(function (text) {
        return text === branchName;
      });
    });
    browser.wait(this.isOpen);
    this.changeCommit(commitIndex);
  };

  this.getSelectedBranch = function () {
    return this.branchSelector.get().$('option:checked');
  };

}

module.exports = GithubCommitMenu;
