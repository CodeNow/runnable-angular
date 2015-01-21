'use strict';

/**
 * Tests a user's ability to fork a running box
 */

var util = require('./helpers/util');

var InstancePage = require('./pages/InstancePage');

describe('Changing commit with multiple repos', function () {
  it('should allow the user to back up to 2 commits ago', function () {
    var instance = new InstancePage('Test-0');
    instance.get();

    waitForRepos(instance);
    instance.commitMenu.getAllRepos().each(function(repo) {
      instance.commitMenu.open(repo);
      instance.commitMenu.changeCommit(repo, 2);
      browser.wait(function () {
        return instance.commitMenu.getCommitsBehind(repo).then(function(commits) {
          return commits === '2';
        });
      });
      expect(instance.repoList.updateButton.get().isPresent()).toBe(true);
      expect(instance.commitMenu.getCommitsBehind(repo)).toEqual('2');
    });
    expect(instance.repoList.updateButton.get().isPresent()).toBe(true);
    instance.repoList.updateButton.get().click();

    waitForRepos(instance);

    instance.commitMenu.getAllRepos().each(function(repo) {
      expect(instance.commitMenu.getCommitsBehind(repo)).toEqual('2');
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

function waitForRepos(instance) {
  browser.wait(function() {
    return util.hasClass(instance.statusIcon, 'running');
  });
  browser.driver.wait(function () {
    return instance.commitLog.get().isDisplayed();
  });

}
