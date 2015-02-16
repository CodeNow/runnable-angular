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

      expect(instance.repoList.updateButton.get().isPresent()).toBe(true);

      commitMenu.commitInfo.get().getText(function (text) {
        expect(text).to.not.equal(currentCommit);
      });
      //browser.wait(repos.first().isDisplayed);
    });
    expect(instance.repoList.updateButton.get().isPresent()).toBe(true);
    instance.repoList.updateButton.get().click();

    waitForRepos(instance);

    oldCommits.forEach(function (commitText, idx) {
      commitMenus[idx].commitInfo.get().getText(function (text) {
        expect(text).to.not.equal(commitText);
      });
    });

  });
  it('should allow the user set both repos back to HEAD ', function () {
    var instance = new InstancePage('Test-0');
    instance.get();

    waitForRepos(instance);
    var allRepos = instance.commitMenu.getAllRepos();
    allRepos.each(function(repo) {

      waitForRepos(instance);
      expect(instance.commitMenu.getCommitsBehind(repo)).toEqual('2');
      instance.commitMenu.fastForward(repo);
      waitForRepos(instance);
      expect(instance.commitMenu.getFastForwardButton(repo).isDisplayed()).toBe(false);
    });
  });

});

function waitForRepos(instance, repo) {
  browser.wait(function () {
    return instance.repoList.repoList.get().isPresent() && instance.repoList.repoList.get().isDisplayed();
  });
}

