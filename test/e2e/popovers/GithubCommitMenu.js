'use strict';

var util = require('../helpers/util');

function GithubCommitMenu() {
  
  this.open = function (repo) {
    var self = this;
    var button = this.getRepoCommitMenuButton(repo);
    button.click();
    return browser.wait(function () {
      return self.isOpen(repo);
    });
  };

  this.isOpen = function (repo) {
    return this.getRepoCommitMenu(repo).isPresent();
  };

  this.numSelectedRepos = function () {
    return element.all(by.repeater('acv in build.contextVersions.models[0].appCodeVersions.models')).then(function(elements) {
      return elements.length;
    });
  };

  this.getAllRepos = function () {
    return element.all(by.repeater('acv in build.contextVersions.models[0].appCodeVersions.models'));
  };

  this.getRepo = function (index) {
    var repo = element(by.repeater('acv in build.contextVersions.models[0].appCodeVersions.models').row(index || 0));

    browser.wait(function () {
      return repo.isDisplayed();
    });
    return repo;
  };

  this.getRepoCommitTitle = function (repo) {
    return repo.element(by.className('commit-message'));
  };

  this.getRepoCommitMenu = function (repo) {
    return repo.element(by.className('commit-group'));
  };

  this.getRepoCommitMenuButton = function (repo) {
    return repo.element(by.css('div.commit.load.ng-isolate-scope'));
  };

  this.filterCommits = function (repo, contents) {
    var field = repo.element(by.css('div.popover.commit-select.ng-isolate-scope.in > h3 > button'));
    browser.wait(function () {
      return field.isPresent();
    }).then(function () {
      return field.sendKeys(contents);
    });
  };

  this.changeCommit = function (repo, index) {
    var self = this;
    browser.wait(function () {
      return self.getRepoCommitMenu(repo).isDisplayed();
    });
    var commit = repo.element(by.repeater('commit in data.activeBranch.commits.models').row(index));
    return commit.click();
  };

  this.getCommitsBehind = function (repo) {
    var self = this;
    browser.wait(function () {
      return self.getFastForwardButton(repo).isPresent();
    });
    return this.getFastForwardButton(repo).getText();
  };

  this.getFastForwardButton = function (repo) {
    browser.wait(function () {
      return repo.isDisplayed();
    });
    return repo.element(by.className('repository-update'));
  };

  this.fastForward = function (repo) {
    var ffbutton = this.getFastForwardButton(repo);
    browser.wait(function () {
      return ffbutton.isPresent();
    });
    browser.wait(function () {
      return ffbutton.isDisplayed();
    });
    ffbutton.click();
  };

  this.changeBranch = function (repo, branchName, commitIndex) {
    var self = this;
    var branch = this.getBranchSelector(repo);
    branch.click();
    var testBranch = branch.element(by.cssContainingText('option', branchName));
    testBranch.click();
    browser.wait(function () {
      return self.getSelectedBranch(repo).getText(function (text) {
        return text === branchName;
      });
    });
    browser.wait(function () {
      return repo.element(by.className('commit-group')).isDisplayed();
    });
    this.changeCommit(repo, commitIndex);
  };

  this.getSelectedBranch = function (repo) {
    return this.getBranchSelector(repo).$('option:checked');
  };

  this.getBranchSelector = function (repo) {
    return repo.element(by.model('data.activeBranch'));
  };

}

module.exports = GithubCommitMenu;
