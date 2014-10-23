var util = require('./helpers/util');
var InstanceEditPage = require('./pages/InstanceEditPage');
var InstancePage = require('./pages/InstancePage');

describe('addRepo', function() {
  it('adds a repo to an instance', function() {
    var instanceEdit = new InstanceEditPage('Test-0');
    instanceEdit.get();

    instanceEdit.repoList.openAddDropdown();

    instanceEdit.repoList.selectRepo(1);

    instanceEdit.buildChanges();

    util.waitForUrl(InstancePage.urlRegex);

    // Technically this works but it's a little unorthodox
    expect(instanceEdit.repoList.numSelectedRepos()).toEqual(2);
  });
});