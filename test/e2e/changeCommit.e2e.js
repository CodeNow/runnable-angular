'use strict';

/**
 * Tests a user's ability to fork a running box
 */

var util = require('./helpers/util');

var InstancePage = require('./pages/InstancePage');

describe('Changing commit', function () {
  it('should allow the user to back up to 2 commits ago, then go back to HEAD ', function () {
    var instance = new InstancePage('Test-0');
    instance.get();

    browser.wait(function () {
      return instance.commitLog.get().isPresent();
    });

    var repo = instance.commitMenu.getRepo();
    waitForRepos(instance, repo);
    instance.commitMenu.open(repo);
    instance.commitMenu.changeCommit(repo, 2);

    waitForRepos(instance, repo);
    expect(instance.commitMenu.getCommitsBehind(repo)).toEqual('2');
    instance.commitMenu.fastForward(repo);

    waitForRepos(instance, repo);
    expect(instance.commitMenu.getFastForwardButton(repo).isPresent()).toBe(false);
  });

  it('should allow the user filter commits by commit text ', function () {
    var instance = new InstancePage('Test-0');
    instance.get();

    browser.wait(function () {
      return instance.commitLog.get().isPresent();
    });

    var repo = instance.commitMenu.getRepo();
    browser.wait(function () {
      return repo.isDisplayed();
    });
    instance.commitMenu.open(repo);
    instance.commitMenu.filterCommits(repo, 'README.md');

    instance.commitMenu.changeCommit(repo, 0);

    waitForRepos(instance, repo);
    instance.commitMenu.getRepoCommitTitle(repo).getText(function(text) {
      expect(text).toContain('README.md');
    });
    expect(instance.commitMenu.getCommitsBehind(repo)).toEqual('1');
    instance.commitMenu.fastForward(repo);

    waitForRepos(instance, repo);
    expect(instance.commitMenu.getFastForwardButton(repo).isPresent()).toBe(false);
  });

  it('should allow the user to change the branch to !master', function () {
    var instance = new InstancePage('Test-0');
    instance.get();

    browser.wait(function () {
      return instance.commitLog.get().isPresent();
    });

    var repo = instance.commitMenu.getRepo();
    browser.wait(function () {
      return repo.isDisplayed();
    });
    instance.commitMenu.open(repo);
    instance.commitMenu.changeBranch(repo, 'test1', 3);

    waitForRepos(instance, repo);
    expect(instance.commitMenu.getCommitsBehind(repo)).toEqual('3');

    instance.commitMenu.open(repo);
    instance.commitMenu.getSelectedBranch(repo).getText(function (text) {
      expect(text).toBe('test1');
    });
  });

  it('should allow the user to change the branch back to master', function () {
    var instance = new InstancePage('Test-0');
    instance.get();
    browser.wait(function () {
      return instance.commitLog.get().isPresent();
    });

    var repo = instance.commitMenu.getRepo();
    browser.wait(function () {
      return repo.isDisplayed();
    });
    waitForRepos(instance, repo);
    instance.commitMenu.open(repo);
    instance.commitMenu.changeBranch(repo, 'master', 0);

    waitForRepos(instance, repo);

    instance.commitMenu.open(repo);
    instance.commitMenu.getSelectedBranch(repo).getText(function (text) {
      expect(text).toBe('master');
    });
    waitForRepos(instance, repo);
    expect(instance.commitMenu.getFastForwardButton(repo).isPresent()).toBe(false);
  });

});

function waitForRepos(instance, repo) {
  browser.wait(function() {
    return util.hasClass(instance.statusIcon, 'running');
  });
  browser.wait(function() {
    if (repo) {
      return repo.isDisplayed();
    } else {
      return instance.commitLog.get().isDisplayed();
    }
  });
}
