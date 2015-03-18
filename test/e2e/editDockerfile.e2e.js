'use strict';

var util = require('./helpers/util');

var InstancePage = require('./pages/InstancePage');
var InstanceEditPage = require('./pages/InstanceEditPage');
var users = require('./helpers/users');
var NEW_DOCKER_FILE_CONTENT = 'FROM rails\nRUN echo $(date)\nEXPOSE 3000\n# Add repository files to server\nADD ./RailsProject /RailsProject\nWORKDIR /RailsProject\nRUN bundle install\n# Command to start the app\nCMD rails server';

describe('edit dockerfile', users.doMultipleUsers(function (username) {
  it('should edit the dockerfile and builds the instance: ' + username, function() {
    var instanceEdit = new InstanceEditPage('RailsProject');
    instanceEdit.get();

    browser.wait(function() {
      return instanceEdit.activePanel.getActiveTab().then(function (tabText) {
        return tabText === 'Dockerfile';
      });
    });

    instanceEdit.activePanel.clearActiveFile();

    instanceEdit.activePanel.writeToFile(NEW_DOCKER_FILE_CONTENT);

    instanceEdit.buildChanges();


    util.waitForUrl(InstancePage.urlRegex());

    instanceEdit.get();
    browser.wait(function() {
      return instanceEdit.activePanel.getActiveTab().then(function (tabText) {
        return tabText === 'Dockerfile';
      });
    });
    expect(instanceEdit.activePanel.getFileContents()).toEqual(NEW_DOCKER_FILE_CONTENT);
  });
}));
