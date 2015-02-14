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
  this.getBranchSelector = function (commitMenu) {
    return commitMenu.element(by.className('select'));
  };

  this.open = function (repo) {
    browser.wait(repo.isDisplayed);
    repo.click().then(function () {
      browser.wait(function () {
        return self.commitMenu.get().isPresent();
      });
    });
  };

  this.isOpen = function () {
    return self.commitMenu.get().isDisplayed();
  };

  this.changeCommit = function (index) {

    var commit = self.commitList.get(index);
    return commit.click();
  };

  this.changeBranch = function (branchName, commitIndex) {
    browser.wait(function () {
      return self.getBranchSelector(self.commitMenu.get()).isPresent();
    });
    var branchSelector = self.getBranchSelector(self.commitMenu.get());
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
    return self.getBranchSelector(self.commitMenu.get()).$('option:checked');
  };

}

module.exports = GithubCommitMenu;
