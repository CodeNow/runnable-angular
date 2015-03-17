'use strict';

/**
 * Tests a user's onboarding experience
 * setup => running instance => delete
 */

var util = require('./helpers/util');

var users = require('./helpers/users');
var SetupPage = require('./pages/SetupPage');
var InstancePage = require('./pages/InstancePage');
var GettingStarted = require('./modals/GettingStarted');
var sidebar = require('./helpers/sidebar');

var instances = [{
  name: 'RailsProject',
  filter: 'rails',
  env: [],
  startCommand: '/bin/sh -c rails server'
}, {
  name: 'SPACESHIPS',
  filter: 'SPACE',
  env: ['a=b', 'basd=asasdasdasd'],
  startCommand: '/bin/sh -c npm start'
}];

describe('project creation workflow', users.doMultipleUsers(function (username) {
  instances.forEach(function (instanceData) {
    it('runs through the GS modal', function () {
      // Getting started modal should be open by default
      var gettingStarted = new GettingStarted();

      gettingStarted.modalElem.get().isPresent().then(function (gsShowing) {
        if (!gsShowing) {
          sidebar.newButton().click();
        }
      });

      gettingStarted.filter(instanceData.filter);

      gettingStarted.selectRepo(0);

      gettingStarted.clickButton('Next Step');

      gettingStarted.clickButton('Build Server');

      util.waitForUrl(new RegExp(instanceData.name));
    });

    it('loads a building instance', function () {
      var instance = new InstancePage(instanceData.name);

      instance.get();

      util.waitForUrl(InstancePage.urlRegex());

      // Removing until backend fixes key issue
      browser.wait(function () {
        return util.hasClass(instance.statusIcon, 'running');
      });

      instance.activePanel.setActiveTab('Server Logs');

      expect(instance.activePanel.getContents()).toMatch(instanceData.startCommand);
    });
  });
}, true));
