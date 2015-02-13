'use strict';

var util = require('../helpers/util');

function GithubCommitMenu(repo) {

  this.commitInfo = util.createGetter(by.className('js-repository-commit'), repo);
  this.branchInfo = util.createGetter(by.className('js-repository-branch'), repo);

  // Commit popover menu
  this.commitMenu = util.createGetter(by.className('popover-repository-toggle'), repo);
  this.commitList = util.createGetterAll(by.repeater('commit in data.activeBranch.commits.models'), repo);

  this.branchSelector = util.createGetter(by.model('data.activeBranch'));//, this.commitMenu);

  this.open = function () {
    var self = this;
    return browser.wait(function () {
      return repo.isDisplayed();
    });
    repo.element(by.className('repository-group-text')).click();
    return browser.wait(function () {
      return self.isOpen();
    });
  };

  this.isOpen = function () {
    return this.commitMenu.get().isDisplayed();
  };

  this.changeCommit = function (index) {
    var self = this;
    browser.waitForAngular(function () {
      return self.commitMenu.get(index).isPresent();
    });
    browser.wait(function () {
      return self.commitMenu.get(index).isDisplayed();
    });
    var commit = this.commitMenu.get(index);
    return commit.get().click();
  };

  this.changeBranch = function (branchName, commitIndex) {
    var self = this;
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
    browser.wait(function () {
      return self.commitMenu.get().isDisplayed();
    });
    this.changeCommit(commitIndex);
  };

  this.getSelectedBranch = function () {
    return this.branchSelector.get().$('option:checked');
  };

}

module.exports = GithubCommitMenu;
