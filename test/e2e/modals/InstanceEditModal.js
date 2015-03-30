'use strict';

var util = require('../helpers/util');

var GearMenu = require('../popovers/GearMenu');
var RepoList = require('../directives/RepoList');
var ActivePanel = require('../directives/ActivePanel');

function InstanceEditModal (instanceName) {

  this.modalElem = util.createGetter(by.css('.modal-edit'));

  this.gearMenu = new GearMenu();
  this.repoList = new RepoList();
  this.activePanel = new ActivePanel('InstanceEdit', this.modalElem);

  this.discard = util.createGetter(by.buttonText('Go Back'), this.modalElem);
  this.build = util.createGetter(by.buttonText('Build Server'), this.modalElem);

  this.buildOptions = util.createGetter(by.css('.btn-group > .green.btn-icon'), this.modalElem);
  this.buildWithoutCacheButton = util.createGetter(by.cssContainingText('.popover-list-item', 'Build without cache'), this.modalElem);

  this.isPresent = function () {
    return this.modalElem.get().isPresent();
  };

  this.closeModal = function () {
    var self = this;
    browser.wait(function () {
      return self.discard.get().isDisplayed();
    });
    self.discard.get().click();
  };

  this.get = function () {
    // We need to create a new build each time, thus the workaround
    browser.get('/' + util.getCurrentUser() + '/' + instanceName);
    element(by.cssContainingText('.btn-action', 'Edit')).click();
    var self = this;
    browser.wait(function () {
      return self.isPresent();
    });
  };

  this.buildChanges = function () {
    var self = this;
    this.build.get().click();
  };

  this.buildWithoutCache = function () {
    var self = this;
    this.buildOptions.get().click();
    return browser.wait(function () {
      return self.buildWithoutCacheButton.get().isPresent();
    }).then(function () {
      return self.buildWithoutCacheButton.get().click();
    });
  };
}

module.exports = InstanceEditModal;
