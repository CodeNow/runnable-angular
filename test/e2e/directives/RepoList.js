'use strict';

var util = require('../helpers/util');

function RepoList () {
  this.repos = util.createGetterAll(by.repeater('acv in build.contextVersions.models[0].appCodeVersions.models'));

  this.addButton = util.createGetter(by.css('.repo-list > h2 > a'));
  this.addDropdown = util.createGetter(by.css('section.row.repo-list > h2 > a > div'));

  this.guide = util.createGetter(by.css('.repo-list > .guide'));

  this.updateButton = util.createGetter(by.css('#wrapper > main > section.sidebar.box-sidebar.load.ng-scope > section > h2 > a'));

  this.add = {
    repos: util.createGetterAll(by.repeater('repo in data.githubRepos.models')),
    searchBtn: util.createGetter(by.css('.repo-list > h2 > a > div > h3 > button')),
    filter: util.createGetter(by.model('data.repoFilter'))
  };

  this.showingGuide = function() {
    return this.guide.get().isPresent();
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
    return this.add.searchBtn.get().click().then(function() {
      return browser.wait(function() {
        return self.add.filter.get().isPresent();
      });
    }).then(function() {
      return self.add.filter.get().sendKeys(contents);
    }).then(function() {
      return self.addDropdown.get().evaluate('data.githubRepos.models.length === ' + expectedRepoListLength);
    });
  };

  this.selectRepo = function (idx) {
    this.add.repos.get(idx).click();
  };

  this.deleteRepo = function (idx) {
    var curRepo = this.repos.get(idx);
    curRepo.element(by.css('.repository-actions')).click();
    var deleteBtn = curRepo.element(by.cssContainingText('li', 'Delete'));
    browser.wait(function() {
      return deleteBtn.isPresent();
    });
    deleteBtn.click();
  };

  this.numSelectedRepos = function() {
    return this.repos.get().then(function(elements) {
      return elements.length;
    });
  };
}

module.exports = RepoList;
