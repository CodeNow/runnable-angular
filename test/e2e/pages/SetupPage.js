var util = require('../helpers/util');

var RepoList = require('../directives/RepoList');
var ActivePanel = require('../directives/ActivePanel');

function SetupPage () {
  this.repoList = new RepoList();
  this.activePanel = new ActivePanel();

  this.boxName = util.createGetter(by.model('dataSetup.data.newProjectName'));
  this.createButton = util.createGetter(by.buttonText('Create Box'));

  this.templates = util.createGetter(by.css('#wrapper > main > section.sidebar.box-sidebar.setup.ng-scope > section:nth-child(2)'));
  this.templateGuide = util.createGetter(by.css('#wrapper > main > section.sidebar.box-sidebar.setup.ng-scope > section:nth-child(2) > div.guide.blue.ng-scope'));

  this.validationErrors = util.createGetter(by.css('#wrapper > main > section.sidebar.box-sidebar.setup.ng-scope > section.row.ng-scope > div'));


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

  this.selectBlankTemplate = function() {
    var blankTemplate = element(by.repeater('context in dataSetup.data.seedContexts.models').row(0));
    return blankTemplate.click();
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