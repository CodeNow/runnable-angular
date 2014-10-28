var util = require('../helpers/util');

function RepoList () {
  this.repos = util.createGetterAll(by.repeater('acv in data.version.appCodeVersions.models'));

  this.addButton = util.createGetter(by.css('.repo-list > h2 > a'));
  this.searchButton = util.createGetter(by.css('.repo-list > h2 > a > div > h3 > button'));
  this.searchField = util.createGetter(by.model('data.state.repoFilter'));
  this.addDropdown = util.createGetter(by.css('section.row.repo-list > h2 > a > div'));

  this.guide = util.createGetter(by.css('.repo-list > .guide'));

  this.add = {
    repos: util.createGetterAll(by.repeater('repo in data.githubRepos.models')),
    filter: 'todo'
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
    return this.searchButton.get().click().then(function() {
      return browser.wait(function() {
        return self.searchField.get().isPresent();
      });
    }).then(function() {
      return self.searchField.get().sendKeys(contents);
    }).then(function() {
      return self.addDropdown.get().evaluate('data.githubRepos.models.length === ' + expectedRepoListLength);
    });
  };

  this.selectRepo = function (idx) {
    this.add.repos.get(idx).click();
  };

  this.deleteRepo = function (idx) {
    this.repos.get(idx).element(by.css('.repository-actions')).click();
    var elem = util.createGetter(by.css('#wrapper > main > section.sidebar.box-sidebar.ng-scope > section > ul > li > button > div > div.popover-content'));
    browser.wait(function() {
      return elem.get().isPresent();
    });
    elem.get().click();
  };

  this.numSelectedRepos = function() {
    return element.all(by.repeater('acv in data.version.appCodeVersions.models')).then(function(elements) {
      return elements.length;
    });
  };
}

module.exports = RepoList;