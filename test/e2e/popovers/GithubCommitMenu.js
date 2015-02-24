'use strict';

var util = require('../helpers/util');

function GithubCommitMenu(repo, index) {
  var self = this;
  var thisIndex = index || 0;
  this.repo = repo;
  this.commitInfo = util.createGetter(by.className('js-repository-commit'), repo);
  this.branchInfo = util.createGetter(by.className('js-repository-branch'), repo);

  // Commit popover menu
  this.commitMenu = util.createGetterAll(by.className('popover-repository-toggle'));

  this.getCommitList = function (commitMenu) {
    return commitMenu.all(by.repeater('commit in data.activeBranch.commits.models'));
  };

  this.branchSelector = util.createGetter(by.className('select'), this.commitMenu);
  this.getBranchSelector = function (commitMenu) {
    return commitMenu.element(by.className('select'));
  };

  this.open = function (repo) {
    browser.wait(repo.isDisplayed);
    repo.click().then(function () {
      browser.wait(self.isOpen);
    });
  };

  this.isOpen = function () {
    return self.commitMenu.get(thisIndex).isDisplayed();
  };

  this.changeCommit = function (index) {
    var commitList = this.getCommitList(self.commitMenu.get(thisIndex));
    var commit = commitList.get(index);
    browser.wait(function () {
      return commit.isDisplayed();
    });
    commit.getWebElement().click();
  };

  this.changeBranch = function (branchName, commitIndex) {
    browser.wait(function () {
      return self.getBranchSelector(self.commitMenu.get(thisIndex)).isPresent();
    });
    var branchSelector = self.getBranchSelector(self.commitMenu.get(thisIndex));
    branchSelector.click();
    var testBranch = branchSelector.element(by.cssContainingText('option', branchName));
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
    return self.getBranchSelector(self.commitMenu.get(thisIndex)).$('option:checked');
  };

}

module.exports = GithubCommitMenu;
