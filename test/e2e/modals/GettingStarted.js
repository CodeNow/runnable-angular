'use strict';

var util = require('../helpers/util');

function GettingStarted () {
  this.modalElem = util.createGetter(by.css('.modal-getting-started'));

  this.repoList = util.createGetterAll(by.repeater('repo in githubRepos.models | repos:data.repoFilter | orderBy: \'-attrs.updated_at\''), this.modalElem);// '))

  this.isShowing = function() {
    return this.modalElem.get().isDisplayed();
  };

  this.selectRepo = function(n) {
    return this.modalElem.get().element(by.repeater('repo in githubRepos.models').row(n)).click();
  };

  this.clickButton = function(text) {
    this.modalElem.get().element(by.buttonText(text)).click();
  };
}

module.exports = GettingStarted;