var util = require('./helpers/util');

var InstanceEditPage = require('./pages/InstanceEditPage');

describe('deleteRepo', function() {
  it('should delete a repo from an instance', function() {
    var instanceEdit = new InstanceEditPage('Test-0');
    instanceEdit.get();

    instanceEdit.repoList.deleteRepo(0);

    browser.wait(function() {
      return instanceEdit.activePanel.aceLoaded();
    });

    browser.wait(function () {
      return instanceEdit.activePanel.getActiveTab().then(function (text) {
        return text === 'Dockerfile';
      });
    });

    browser.wait(function() {

    });

    instanceEdit.activePanel.writeToFile('\n#');

    instanceEdit.buildChanges();

    // Technically this works but it's a little unorthodox
    browser.wait(function() {
      return instanceEdit.repoList.numSelectedRepos().then(function(numSelected) {
        return numSelected === 1;
      });
    });
    expect(instanceEdit.repoList.numSelectedRepos()).toEqual(1);
  });
});