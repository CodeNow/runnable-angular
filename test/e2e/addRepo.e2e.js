'use strict';

var util = require('./helpers/util');
var users = require('./helpers/users');
var InstanceEditPage = require('./pages/InstanceEditPage');
var InstancePage = require('./pages/InstancePage');

describe('addRepo', users.doMultipleUsers(function (username) {
  it('adds a repo to an instance: ' + username, function() {
    var instanceEdit = new InstanceEditPage('Test-0');
    instanceEdit.get();

    instanceEdit.repoList.openAddDropdown();

    instanceEdit.repoList.selectRepo(1);

    instanceEdit.buildChanges();

    util.waitForUrl(InstancePage.urlRegex);

    // Technically this works but it's a little unorthodox
    browser.wait(function() {
      return instanceEdit.repoList.numSelectedRepos().then(function(numSelected) {
        return numSelected === 2;
      });
    });
  });

  it('should now have 2 repos', function() {
    var instanceEdit = new InstanceEditPage('Test-0');
    instanceEdit.get();

    util.waitForUrl(InstancePage.urlRegex());

    expect(instanceEdit.repoList.numSelectedRepos()).toEqual(2);
  });
}));
