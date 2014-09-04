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

module.exports = SetupPage;