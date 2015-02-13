'use strict';

var util = require('../helpers/util');
var CommitMenu = require('../popovers/GithubCommitMenu');

function RepoList () {
  this.self = util.createGetter(by.className('repo-list'));
  this.repos = util.createGetterAll(by.repeater('model in unsavedAcvs'), this.self);

  this.addButton = util.createGetter(by.className('btn-add-repo'), this.self);

  this.addDropdown = util.createGetter(by.css('section.row.repo-list > h2 > a > div'));

  this.guide = util.createGetter(by.css('.repo-list > .guide'));

  this.updateButton = util.createGetter(by.buttonText('Update'));

  this.autoDeploy = util.createGetter(by.model('data.autoDeploy'));

  this.add = {
    repos: util.createGetterAll(by.repeater('newRepos')),
    filter: util.createGetter(by.model('data.repoFilter'))
  };

  this.showingGuide = function() {
    return this.guide.get().isPresent();
  };

  this.getCommitMenu = function (repo) {
    return new CommitMenu(repo);
  };

  this.openAddDropdown = function() {
    var self = this;
    return this.addButton.get().click().then(function() {
      return browser.wait(function() {
        return self.addDropdown.get().isPresent();
      });
    }).then(function() {
      return self.addDropdown.get().evaluate('data.githubRepos.models.length > 0');
    });
  };

  this.searchRepos = function (contents, expectedRepoListLength) {
    // First, click the search button
    var self = this;
    return this.add.filter.get().click().then(function () {
      return browser.wait(function () {
        return self.add.filter.get().isPresent();
      });
    }).then(function () {
      return self.add.filter.get().sendKeys(contents);
    }).then(function () {
      return self.addDropdown.get().evaluate('data.githubRepos.models.length === ' + expectedRepoListLength);
    });
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
