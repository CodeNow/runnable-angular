'use strict';

var util = require('./helpers/util');

var InstancePage = require('./pages/InstancePage');
var users = require('./helpers/users');
var NEW_DOCKER_FILE_CONTENT = 'FROM rails\nRUN echo $(date)\nEXPOSE 3000\n# Add repository files to server\nADD ./RailsProject /RailsProject\nWORKDIR /RailsProject\nRUN bundle install\n# Command to start the app\nCMD rails server';

describe('edit dockerfile', users.doMultipleUsers(function (username) {
  it('should edit the dockerfile and builds the instance: ' + username, function () {

    var instance = new InstancePage('RailsProject');
    instance.get();
    instance.openEditModal();
    var instanceEdit = instance.modalEdit;

    browser.wait(function () {
      return instanceEdit.activePanel.getActiveTab().then(function (tabText) {
        return tabText === 'Dockerfile';
      });
    });

    instanceEdit.activePanel.clearActiveFile();

    // Expecting 'missing FROM'
    expect(instanceEdit.getErrorsCount('Dockerfile')).toEqual('1');

    instanceEdit.activePanel.writeToFile('asda');

    // Expecting 'missing FROM' and invalid line
    expect(instanceEdit.getErrorsCount('Dockerfile')).toEqual('2');


    expect(instanceEdit.getTotalErrorsCount()).toEqual('2 errors');

    instanceEdit.activePanel.clearActiveFile();

    instanceEdit.activePanel.writeToFile(NEW_DOCKER_FILE_CONTENT);

    instanceEdit.buildChanges();

    // Removing until backend fixes key issue
    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'running');
    });
    instance.closeNotificationIfPresent();

    instance.openEditModal();

    browser.wait(function () {
      return instance.modalEdit.activePanel.getActiveTab().then(function (tabText) {
        return tabText === 'Dockerfile';
      });
    });
    expect(instance.modalEdit.activePanel.getFileContents()).toEqual(NEW_DOCKER_FILE_CONTENT);
    instance.modalEdit.closeModal();
  });
}));
