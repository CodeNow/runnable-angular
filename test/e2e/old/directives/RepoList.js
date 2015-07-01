'use strict';

var util = require('../helpers/util');
var CommitMenu = require('../popovers/GithubCommitMenu');

function RepoList () {
  this.repoList = util.createGetter(by.className('repo-list'));
  this.repos = util.createGetterAll(by.className('repository-group-text'));//, this.self);

  this.addButton = util.createGetter(by.className('btn-add-repo'), this.repoList);

  this.addDropdown = util.createGetter(by.css('.popover-add-repo'));

  this.guide = util.createGetter(by.css('.repo-list > .guide'));

  this.updateButton = util.createGetter(by.buttonText('Update'));

  this.autoDeploy = util.createGetter(by.model('data.autoDeploy'));

  this.add = {
    repos: util.createGetterAll(by.repeater('repo in data.githubRepos.models')),
    filter: util.createGetter(by.model('data.repoFilter'))
  };

  this.showingGuide = function() {
    return this.guide.get().isPresent();
  };

  this.getCommitMenu = function (repo, index) {
    return new CommitMenu(repo, index);
  };

  this.openAddDropdown = function() {
    var self = this;
    this.addButton.get().click();
    browser.wait(function() {
      return self.addDropdown.get().isPresent();
    });
    return self.addDropdown.get().evaluate('data.githubRepos.models.length > 0');
  };

  this.searchRepos = function (contents, expectedRepoListLength) {
    // First, click the search button
    var self = this;
    this.add.filter.get().click();
    browser.wait(function () {
      return self.add.filter.get().isPresent();
    });

    var filter = self.add.filter.get();
    filter.click();
    filter.sendKeys(contents);
    self.addDropdown.get().evaluate('data.githubRepos.models.length === ' + expectedRepoListLength);
  };

  this.selectRepo = function (idx) {
    this.add.repos.get(idx).click();
  };

  this.deleteRepo = function (idx) {
    var curRepo = this.repos.get(idx);
    curRepo.element(by.className('btn-repository-settings')).click();
    var deleteBtn = curRepo.element(by.cssContainingText('li', 'Delete'));
    browser.wait(function () {
      return deleteBtn.isPresent();
    });
    deleteBtn.click();
  };

  this.numSelectedRepos = function () {
    return this.repos.get().then(function (elements) {
      return elements.length;
    });
  };
}

module.exports = RepoList;
