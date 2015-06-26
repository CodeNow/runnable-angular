'use strict';

var util = require('../helpers/util');

function GettingStarted () {
  this.modalElem = util.createGetter(by.css('.modal-getting-started'));

  this.repoList = util.createGetterAll(by.repeater('repo in githubRepos.models | repos:data.repoFilter | orderBy: \'-attrs.updated_at\''), this.modalElem);// '))

  this.search = util.createGetter(by.model('data.repoFilter'));

  this.isShowing = function() {
    return this.modalElem.get().isDisplayed();
  };

  this.selectRepo = function(n) {
    return this.modalElem.get().element(by.repeater('repo in githubRepos.models').row(n)).click();
  };

  this.clickButton = function(text) {
    this.modalElem.get().element(by.buttonText(text)).click();
  };

  this.filter = function(text) {
    var searchBox = this.search.get();
    searchBox.click();
    searchBox.sendKeys(text);
  };
}

module.exports = GettingStarted;