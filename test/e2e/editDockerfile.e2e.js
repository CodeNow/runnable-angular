'use strict';

var util = require('./helpers/util');

var InstancePage = require('./pages/InstancePage');
var InstanceEditPage = require('./pages/InstanceEditPage');
var users = require('./helpers/users');
var NEW_DOCKER_FILE_CONTENT = 'FROM dockerfile/nodejs\nADD ./node_hello_world /node_hello_world\nWORKDIR /node_hello_world\nEXPOSE 80\nCMD node server.js';

describe('edit dockerfile', users.doMultipleUsers(function (username) {
  it('should edit the dockerfile and builds the instance: ' + username, function() {
    var instanceEdit = new InstanceEditPage('node_hello_world');
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

    expect(instanceEdit.activePanel.getFileContents()).toMatch(NEW_DOCKER_FILE_CONTENT);
  });
}));
