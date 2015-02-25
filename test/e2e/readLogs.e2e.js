'use strict';

var InstancePage = require('./pages/InstancePage');
var util = require('./helpers/util');

describe('logs', function() {
  it('should output the proper logs', function() {
    var instance = new InstancePage('Test-0');
    instance.get();

    instance.activePanel.setActiveTab('Build Logs');

    instance.activePanel.getContents().then(function (text) {
      expect(text).toMatch('Cloning \'' + util.getCurrentUser() + '/node-hello-world\' into \'./node-hello-world\'...');
      expect(text).toMatch('FROM dockerfile/nodejs');
      expect(text).toMatch('Build completed successfully!');
    });

    instance.activePanel.setActiveTab('Box Logs');

    browser.wait(function() {
      return instance.activePanel.isClean();
    });
    instance.activePanel.currentContent.get().getText().then(function (text) {
      // Test that we're properly showing the command
      expect(text).toMatch('node /hello/server.js');
      // Test that we're properly outputting the logs
      expect(text).toMatch('Server running at http://127.0.0.1:80/');
    });
  });
});
