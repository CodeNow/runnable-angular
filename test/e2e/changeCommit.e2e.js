'use strict';

/**
 * Tests a user's ability to fork a running box
 */

var util = require('./helpers/util');

var InstancePage = require('./pages/InstancePage');

describe('Changing commit', function () {

  it('should allow the user to change the branch to !master', function () {
    var instance = new InstancePage('node_hello_world');
    instance.get();

    browser.wait(function () {
      return instance.repoList.repoList.get().isPresent();
    });

    var repo = instance.repoList.repos.get().first();

    browser.wait(repo.isDisplayed);
    var commitMenu = instance.repoList.getCommitMenu(repo);

    commitMenu.open(repo);
    commitMenu.changeBranch('test1', 3);

    waitForRepos(instance, repo);
    browser.wait(commitMenu.branchInfo.get().isDisplayed);

    commitMenu.branchInfo.get().getText(function (text) {
      expect(text).toBe('test1');
    });
    commitMenu.commitInfo.get().getText(function (text) {
      expect(text).to.match(/Create server\.js/);
    });
    commitMenu.open(repo);
    commitMenu.getSelectedBranch(repo).getText(function (text) {
      expect(text).toBe('test1');
    });


  });

  it('should allow the user to change the branch back to master', function () {
    var instance = new InstancePage('node_hello_world');
    instance.get();
    browser.wait(function () {
      return instance.repoList.repoList.get().isPresent();
    });

    var repo = instance.repoList.repos.get(0);
    browser.wait(function () {
      return repo.isDisplayed();
    });
    var commitMenu = instance.repoList.getCommitMenu(repo);
    commitMenu.open(repo);
    commitMenu.changeBranch('master', 0);

    waitForRepos(instance, repo);
    browser.wait(repo.isDisplayed);
    commitMenu.branchInfo.get().getText(function (text) {
      expect(text).toBe('master');
    });
    commitMenu.commitInfo.get().getText(function (text) {
      expect(text).to.match(/Update server\.js/);
    });

    commitMenu.open(repo);
    commitMenu.getSelectedBranch(repo).getText(function (text) {
      expect(text).toBe('master');
    });
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
      return instance.repoList.self.get().isDisplayed();
    }
  });
}
