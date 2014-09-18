var util = require('../helpers/util');

var RepoList = require('../directives/RepoList');

function SetupPage () {
  this.boxName = util.createGetter(by.model('dataSetup.data.newProjectName'));
  this.createButton = util.createGetter(by.buttonText('Create Box'));

  this.repoList = new RepoList();

  this.templates = util.createGetter(by.css('#wrapper > main > section.sidebar.box-sidebar.setup.ng-scope > section:nth-child(2)'));
  this.templateGuide = util.createGetter(by.css('#wrapper > main > section.sidebar.box-sidebar.setup.ng-scope > section:nth-child(2) > div.guide.blue.ng-scope'));

  this.validationErrors = util.createGetter(by.css('#wrapper > main > section.sidebar.box-sidebar.setup.ng-scope > section.row.ng-scope > div'));

  this.ace = util.createGetter(by.css('#wrapper > main > section.views.ng-scope > div.active-panel.ng-scope.loaded.ace-runnable-dark > pre > div.ace_scroller > div'));
  this.aceComment = util.createGetter(by.css('#wrapper > main > section.views.ng-scope > div.active-panel.ng-scope.loaded.ace-runnable-dark > pre > div.ace_scroller > div > div.ace_layer.ace_text-layer > div > span'));

  this.get = function () {
    var self = this;
    return browser.get('/runnable-doobie/new');/*.then(function() {
      return util.waitForUrl(self.attrs.urlRegex);
    }).then(function() {
      self.attrs.id = util.regex.objectId.exec(browser.getCurrentUrl())[0];
      console.log(self.attrs.id);
      return;
    });*/
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

  this.aceLoaded = function () {
    return this.ace.get().isPresent();
  };

  this.blankTemplateLoaded = function() {
    return this.ace.get().getText().then(function(text) {
      return text === '# Empty Dockerfile!';
    });
  };

  // http://stackoverflow.com/q/25675973/1216976
  // https://github.com/angular/protractor/issues/1273
  this.addToDockerfile = function (contents) {
    var aceDiv = element(by.css('div.ace_content'));
    var inputElm = element(by.css('textarea.ace_text-input'));

    browser.actions().doubleClick(aceDiv).perform();
    return inputElm.sendKeys(contents);
  };

  this.dockerfileValidates = function () {
    return this.validationErrors.get().isPresent().then(function (isPresent) {
      return !isPresent;
    });
  };

  this.dockerfileIsClean = function () {
    return element(by.css('.box-header')).evaluate('dataSetup.data.openItems.isClean()');
  };
}

SetupPage.urlRegex = new RegExp(util.processUrl('/runnable-doobie/new/' + util.regex.objectId));





/*
function SetupPage (projectName) {
  this.attrs = {};
  this.attrs.projectName = projectName;

  // TODO: this should be by model
  this.projectTitle = element(by.css('#wrapper > main > nav > h1 > input'));

  this.repos = {};
  this.repos.filter = element(by.model('dataSetup.data.repoFilter'));
  this.repos.list = element.all(by.repeater('repo in dataSetup.data.githubRepos.models | unaddedRepos:dataSetup.data.contextVersion.appCodeVersions | repos:dataSetup.data.repoFilter'));
  this.repos.first = element(by.repeater('repo in dataSetup.data.githubRepos.models | unaddedRepos:dataSetup.data.contextVersion.appCodeVersions | repos:dataSetup.data.repoFilter').row(0));
  // Can't use `buttonText` here because it's changing
  this.repos.addButton = element(by.css('#wrapper > main > section > ng-form > button'));

  this.templates = element.all(by.repeater('context in dataSetup.data.seedContexts.models'));
  this.validationErrors = element(by.css('#wrapper > main > section > form > section.sidebar-form-section.sidebar-validation.ng-scope'));
  this.buildButton = element(by.buttonText('Build Project'));

  this.ace = {};
  this.ace.container = element(by.css('#editor > div.editor-container.ng-scope.loaded > pre > div.ace_scroller > div'));
  this.ace.textarea = element(by.css('#editor > div.editor-container.ng-scope.loaded > pre > textarea'));

  this.get = function () {
    return browser.get('/new/runnable-doobie/' + this.attrs.projectName);
  };

  this.reposLoaded = function () {
    return element(by.css('#wrapper > main > section > ng-form > ul > li:nth-child(2)')).isPresent();
  }
  this.selectFirstRepo = function () {
    var firstRepo = element(by.repeater('repo in dataSetup.data.githubRepos.models').row(0));
    firstRepo.click();
  };

  this.addRepos = function () {
    return this.repos.addButton.click();
  };

  this.selectBlankTemplate = function () {
    var blankTemplate = element(by.repeater('context in dataSetup.data.seedContexts.models').row(1));
    blankTemplate.click();
  };

  this.aceLoaded = function () {
    return element(by.css('#editor > div.editor-container.ng-scope.loaded > pre > div.ace_scroller > div')).isPresent();
  };

  // http://stackoverflow.com/q/25675973/1216976
  // https://github.com/angular/protractor/issues/1273
  this.addToDockerfile = function (contents) {
    var aceDiv = element(by.css('div.ace_content'));
    var inputElm = element(by.css('textarea.ace_text-input'));

    browser.actions().doubleClick(aceDiv).perform();
    inputElm.sendKeys('\nFROM dockerfile/nodejs\nCMD sleep 1000000');
  };

  this.dockerfileValidates = function () {
    return element(by.css('#wrapper > main > section > form > section.sidebar-form-section.sidebar-validation.ng-scope')).isPresent().then(function (isPresent) {
      return !isPresent;
    });
  };

  this.dockerfileIsClean = function () {
    return element(by.css('.sub-header')).evaluate('dataSetup.data.openItems.isClean()');
  };

  this.build = function () {
    return this.buildButton.click();
  };
};
*/
module.exports = SetupPage;