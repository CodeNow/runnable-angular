var util = require('./helpers/util');

var InstanceEdit = require('./pages/InstanceEditPage');

describe('edit dockerfile', function() {
  it('should edit the dockerfile and builds the instance', function() {
    var instanceEdit = new InstanceEdit('Test-0');
    instanceEdit.get();

    browser.wait(function() {
      return instanceEdit.activePanel.getActiveTab.then(function (tabText) {
        return tabText === 'Dockerfile';
      });
    });

    instanceEdit.addToDockerfile('\n#a comment');

    instanceEdit.buildChanges();
  });
});