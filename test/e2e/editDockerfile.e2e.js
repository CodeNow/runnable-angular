'use strict';

var util = require('./helpers/util');

var InstancePage = require('./pages/InstancePage');
var InstanceEditPage = require('./pages/InstanceEditPage');

describe('edit dockerfile', function() {
  it('should edit the dockerfile and builds the instance', function() {
    var instanceEdit = new InstanceEditPage('Test-0');
    instanceEdit.get();

    browser.wait(function() {
      return instanceEdit.activePanel.getActiveTab().then(function (tabText) {
        return tabText === 'Dockerfile';
      });
    });

    instanceEdit.activePanel.clearActiveFile();

    instanceEdit.activePanel.writeToFile('\nFROM dockerfile/nodejs\nADD ./node-hello-world /hello\nWORKDIR /\nEXPOSE 80\nCMD node /hello/server.js\n');

    browser.wait(function() {
      return instanceEdit.activePanel.isClean();
    });

    instanceEdit.buildChanges();

    util.waitForUrl(InstancePage.urlRegex);

    var instance = new InstancePage('Test-0');

    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'running');
    });
  });
});
