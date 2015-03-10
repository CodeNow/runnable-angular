'use strict';

var util = require('./helpers/util');

var InstancePage = require('./pages/InstancePage');
var users = require('./helpers/users');
var NEW_FILE_CONTENT = 'Hello!!!';

describe('edit container file', users.doMultipleUsers(function (username) {
  it('should edit the file and restart the instance: ' + username, function () {
    var instance = new InstancePage('SPACESHIPS');
    instance.get();

    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'running');
    });

    instance.fileExplorer.openFolder('SPACESHIPS');
    instance.fileExplorer.openFile('LICENSE');

    instance.activePanel.clearActiveFile();

    instance.activePanel.writeToFile(NEW_FILE_CONTENT);
    expect(instance.activePanel.isActiveTabDirty()).toBe.true;
    instance.save();
    expect(instance.activePanel.isActiveTabDirty()).toBe.false;

    instance.get();

    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'running');
    });

    instance.fileExplorer.openFolder('SPACESHIPS');
    instance.fileExplorer.openFile('LICENSE');

    expect(instance.activePanel.getFileContents()).toMatch(NEW_FILE_CONTENT);

  }, 30000);
}));
