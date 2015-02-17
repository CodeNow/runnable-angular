'use strict';

/**
 * Tests a user's ability to fork a running box
 */

var util = require('./helpers/util');

var InstancePage = require('./pages/InstancePage');

describe('Changing commit with multiple repos', function () {
  it('should allow the user to back up to 2 commits ago', function () {
    var instance = new InstancePage('Test-1');
    instance.get();
    waitForRepos(instance);
    var repos = instance.repoList.repos.get();

    browser.wait(repos.first().isDisplayed);

    var oldCommits = [];
    var commitMenus = [];
    repos.each(function (repo, idx) {
      var commitMenu = instance.repoList.getCommitMenu(repo, idx);
      commitMenus.push(commitMenu);
      var currentCommit = commitMenu.commitInfo.get().getText();
      oldCommits.push(currentCommit);

      commitMenu.open(repo);
      commitMenu.changeCommit(2);

      expect(instance.repoList.updateButton.get().isDisplayed()).toBe(true);

      commitMenu.commitInfo.get().getText(function (text) {
        expect(text).to.not.equal(currentCommit);
      });
      //browser.wait(repos.first().isDisplayed);
    });
    expect(instance.repoList.updateButton.get().isDisplayed()).toBe(true);
    instance.repoList.updateButton.get().click();

    waitForRepos(instance);

    oldCommits.forEach(function (commitText, idx) {
      commitMenus[idx].commitInfo.get().getText(function (text) {
        expect(text).to.not.equal(commitText);
      });
    });

  });
  it('should only change 1 repo back to HEAD', function () {
    var instance = new InstancePage('Test-1');
    instance.get();
    waitForRepos(instance);
    var repos = instance.repoList.repos.get();

    browser.wait(repos.first().isDisplayed);

    var oldCommits = [];
    var repo = repos.get(0);

    var commitMenu = instance.repoList.getCommitMenu(repo, 0);
    var commitMenu2 = instance.repoList.getCommitMenu(repo, 1);
    var currentCommit = commitMenu.commitInfo.get().getText();
    var currentCommit2 = commitMenu.commitInfo.get().getText();
    oldCommits.push(currentCommit);
    oldCommits.push(currentCommit2);

    commitMenu.open(repo);
    commitMenu.changeCommit(0);

    expect(instance.repoList.updateButton.get().isDisplayed()).toBe(true);

    commitMenu.commitInfo.get().getText(function (text) {
      expect(text).to.not.equal(currentCommit);
    });
    commitMenu2.commitInfo.get().getText(function (text) {
      expect(text).to.equal(currentCommit2);
    });

    instance.repoList.updateButton.get().click();

    waitForRepos(instance);

    commitMenu.commitInfo.get().getText(function (text) {
      expect(text).to.not.equal(oldCommits[0]);
    });
    commitMenu2.commitInfo.get().getText(function (text) {
      expect(text).to.equal(oldCommits[1]);
    });
    instance.get();
    waitForRepos(instance);
    commitMenu.commitInfo.get().getText(function (text) {
      expect(text).to.not.equal(oldCommits[0]);
    });
    commitMenu2.commitInfo.get().getText(function (text) {
      expect(text).to.equal(oldCommits[1]);
    });
  });
  it('should reset the other repo back to head', function () {
    var instance = new InstancePage('Test-1');
    instance.get();
    waitForRepos(instance);
    var repos = instance.repoList.repos.get();

    browser.wait(repos.first().isDisplayed);

    var oldCommits = [];
    var repo = repos.get(1);

    var commitMenu = instance.repoList.getCommitMenu(repo, 0);
    var commitMenu2 = instance.repoList.getCommitMenu(repo, 1);
    var currentCommit = commitMenu.commitInfo.get().getText();
    var currentCommit2 = commitMenu.commitInfo.get().getText();
    oldCommits.push(currentCommit);
    oldCommits.push(currentCommit2);

    commitMenu2.open(repo);
    commitMenu2.changeCommit(0);

    expect(instance.repoList.updateButton.get().isDisplayed()).toBe(true);

    commitMenu.commitInfo.get().getText(function (text) {
      expect(text).to.equal(currentCommit);
    });
    commitMenu2.commitInfo.get().getText(function (text) {
      expect(text).to.not.equal(currentCommit2);
    });

    instance.repoList.updateButton.get().click();

    waitForRepos(instance);

    commitMenu.commitInfo.get().getText(function (text) {
      expect(text).to.equal(oldCommits[0]);
    });
    commitMenu2.commitInfo.get().getText(function (text) {
      expect(text).to.not.equal(oldCommits[1]);
    });
    instance.get();
    waitForRepos(instance);
    commitMenu.commitInfo.get().getText(function (text) {
      expect(text).to.equal(oldCommits[0]);
    });
    commitMenu2.commitInfo.get().getText(function (text) {
      expect(text).to.not.equal(oldCommits[1]);
    });
  });

});

function waitForRepos(instance, repo) {
  browser.wait(function () {
    return instance.repoList.repoList.get().isPresent() && instance.repoList.repoList.get().isDisplayed();
  });
}

