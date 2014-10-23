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

module.exports = SetupPage;