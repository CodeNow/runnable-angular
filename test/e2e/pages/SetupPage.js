'use strict';

var util = require('../helpers/util');

var RepoList = require('../directives/RepoList');
var ActivePanel = require('../directives/ActivePanel');

function SetupPage () {
  this.repoList = new RepoList();
  this.activePanel = new ActivePanel('Setup');

  this.boxName = util.createGetter(by.model('newInstanceName'));
  this.createButton = util.createGetter(by.buttonText('Create Box'));

  this.templates = util.createGetter(by.css('#wrapper > main > section.sidebar.box-sidebar.ng-scope > section:nth-child(2)'));
  this.templateGuide = util.createGetter(by.css('#wrapper > main > section.sidebar.box-sidebar.ng-scope > section:nth-child(2) > div.guide.blue.ng-scope'));

  this.validationErrors = util.createGetter(by.css('#wrapper > main > section.sidebar.box-sidebar.ng-scope > section.row.ng-scope > div'));


  this.get = function () {
    var self = this;
    return browser.get('/runnable-doobie/new');
  };

  this.setBoxName = function (newName) {
    return this.boxName.get().sendKeys(newName);
  };

  this.createBox = function () {
    return this.createButton.get().click();
  };

  this.selectTemplate = function(text) {
    var template = this.templates.get().element(by.cssContainingText('div.label-group > label', text));
    return template.click();
  };

  this.blankTemplateLoaded = function() {
    return this.activePanel.getFileContents().then(function(text) {
      return text === '# Empty Dockerfile!';
    });
  };

  this.dockerfileValidates = function () {
    return this.validationErrors.get().isPresent().then(function (isPresent) {
      return !isPresent;
    });
  };
}

SetupPage.urlRegex = new RegExp(util.processUrl('/runnable-doobie/new/' + util.regex.objectId));

module.exports = SetupPage;
