var util = require('../helpers/util');

function RepoList () {
  this.addButton = util.createGetter(by.css('.repo-list > h2 > a'));
  this.addDropdown = util.createGetter(by.css('section.row.repo-list > h2 > a > div'));

  this.guide = util.createGetter(by.css('.repo-list > .guide'));


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

  this.selectFirstRepo = function () {
    var firstRepo = element(by.repeater('repo in data.githubRepos.models').row(0));
    return firstRepo.click();
  };

  this.numSelectedRepos = function() {
    return element.all(by.repeater('repo in data.version.appCodeVersions.models')).then(function(elements) {
      return elements.length;
    });
  };
}

module.exports = RepoList;