'use strict';

var util = require('../helpers/util');

var GearMenu = require('../popovers/GearMenu');
var RepoList = require('../directives/RepoList');
var ActivePanel = require('../directives/ActivePanel');

function InstancePage (name) {
  this.name = name;

  this.gearMenu = new GearMenu();
  this.repoList = new RepoList();
  this.activePanel = new ActivePanel('Instance');

  this.statusIcon = util.createGetter(by.css('header > h1 > div > span'));
  this.instanceName = util.createGetter(by.css('#wrapper > main > header > h1 > div'));

  this.get = function() {
    return browser.get('/' + util.getCurrentUser() + '/' + this.name);
  };

  this.getName = function () {
    return this.instanceName.get().getText();
  };

  this.buildLogsOpen = function () {
    return this.buildLogs.get().isPresent();
  };
}

InstancePage.urlRegex = function () {
  return new RegExp(util.processUrl('/' + util.getCurrentUser() + '/' + util.regex.instanceName));
};

module.exports = InstancePage;
