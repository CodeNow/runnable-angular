var util = require('../helpers/util');

function GithubCommitMenu() {
  
  this.open = function (repo) {
    var self = this;
    var button = this.getRepoCommitMenuButton(repo);
    button.click();
    return browser.wait(function () {
      return self.isOpen(repo);
    });
  };

  this.isOpen = function (repo) {
    return this.getRepoCommitMenu(repo).isPresent();
  };

  this.numSelectedRepos = function () {
    return element.all(by.repeater('acv in data.version.appCodeVersions.models')).then(function(elements) {
      return elements.length;
    });
  };

  this.getRepo = function (index) {
    var repo = element(by.repeater('acv in data.version.appCodeVersions.models').row(index || 0));

    browser.wait(function () {
      return repo.isDisplayed();
    });
    return repo;
  };

  this.openRepoMenuGearMenu = function (repo) {
    repo.$('#wrapper > main > section.sidebar.box-sidebar.ng-scope > section > ul > li:nth-child(2) > button').click();
  };

  this.deleteSelectedRepo = function (repo) {
    var menu = this.openRepoMenuGearMenu(repo);
    menu.element('ul > li:nth-child(1) > button > div > div.popover-content > ul > li').click();
  };

  this.getRepoCommitMenu = function (repo) {
    return repo.element(by.repeater('commit in data.githubRepo.state.selectedBranch.commits.models'));
  };

  this.getRepoCommitMenuButton = function (repo) {
    return repo.element(by.css('.commit'));
  };

  this.filterCommits = function (repo, contents) {
    var field = repo.element(by.css('div.popover.commit-select.ng-isolate-scope.in > h3 > input'));
    browser.wait(function () {
      return field.isPresent();
    }).then(function () {
      return field.sendKeys(contents);
    });
  };
  
  this.changeCommit = function (repo, index) {
    var commit = repo.element(by.repeater('commit in data.githubRepo.state.selectedBranch.commits.models').row(index));
    return commit.click();
  };

  this.getCommitsBehind = function (repo) {
    return this.getFastForwardButton(repo).getText();
  };

  this.getFastForwardButton = function (repo) {
    return repo.element(by.css('#wrapper > main > section.sidebar.box-sidebar.load.ng-scope > section > ul > li > button'));
  };

  this.fastForward = function (repo) {
    var ffbutton = this.getFastForwardButton(repo);
    if (ffbutton.isPresent()) {
      ffbutton.click();
    }
  };

  this.changeBranch = function (repo, branchName, commitIndex) {
    var branch = this.getBranchSelector(repo);
    branch.click();
    var testBranch = branch.element(by.cssContainingText('option', branchName));
    testBranch.click();
    this.changeCommit(repo, commitIndex);
  };

  this.getSelectedBranch = function (repo) {
    return this.getBranchSelector(repo).$('option:checked');
  };

  this.getBranchSelector = function (repo) {
    return repo.element(by.model('data.githubRepo.state.selectedBranch'));
  };

}

module.exports = GithubCommitMenu;
