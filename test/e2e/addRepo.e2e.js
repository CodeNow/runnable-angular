var util = require('./helpers/util');
var InstanceEditPage = require('./pages/InstanceEditPage');
var RepoList = require('./directives/RepoList');

describe('addRepo', function() {
  it('adds a repo to a running instance', function() {
    var instanceEdit = new InstanceEditPage('Test-0');
    var repoList = new RepoList();
    instanceEdit.get();
  });
});