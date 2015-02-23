'use strict';

/**
 * Tests a user's onboarding experience
 * setup => running instance => delete
 */

var util = require('./helpers/util');

var SetupPage = require('./pages/SetupPage');
var InstancePage = require('./pages/InstancePage');
var GettingStarted = require('./modals/GettingStarted');

var instances = ['Test-0', 'Test-1'];
var ENV_VARS = [null, 'a=b\nbasd=asasdasdasd'];

describe('project creation workflow', function () {
  it('runs throug the GS modal', function() {
    // Getting started modal should be open by default
    var gettingStarted = new GettingStarted();

    gettingStarted.filter('node-hello');

    gettingStarted.selectRepo(0);

    gettingStarted.clickButton('Next Step');

    gettingStarted.clickButton('Build Server');

    util.waitForUrl(InstancePage.urlRegex);
  });

  it('loads a building instance', function() {
    var instance = new InstancePage('node_hello_world');

    instance.get();

    util.waitForUrl(InstancePage.urlRegex);

    // Removing until backend fixes key issue
    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'running');
    });

    instance.activePanel.setActiveTab('Server Logs');

    expect(instance.activePanel.getContents()).toMatch('/bin/sh -c npm start');
  });
});
