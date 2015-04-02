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


  this.input = util.createGetter(by.model('state.name'), this.modalElem);

  this.discard = util.createGetter(by.buttonText('Go Back'), this.modalElem);
  this.build = util.createGetter(by.css('.modal-footer .btn:not(.btn-icon-sm)'), this.modalElem);

  this.buildOptions = util.createGetter(by.css('.modal-footer .btn.btn-icon-sm'), this.modalElem);
  this.buildWithoutCacheButton = util.createGetter(by.cssContainingText('.popover-list-item', 'Build without cache'));

  this.environmentalVars = util.createGetter(by.cssContainingText('.file', 'environment variables'));

  this.getErrorsCount = function (buttonText) {
    if (!buttonText) {
      buttonText = 'environmental variables';
    }
    var button = util.createGetter(by.cssContainingText('.file', buttonText)).get();
    var errorElement = button.element(by.css('.btn-file-errors'));
    return errorElement.getText();
  };

  this.getTotalErrorsCount = function () {
    return this.build.get().getText();
  };

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

  this.openEnvs = function () {
    var self = this;
    this.environmentalVars.get().click();
    browser.wait(function () {
      return self.activePanel.getActiveTab().then(function (tabText) {
        return tabText === 'Env Vars';
      });
    });
  };

  this.renameBox = function (newName) {
    var self = this;

    browser.wait(function() {
      return self.input.get().isPresent();
    });

    self.input.get().clear();
    self.input.get().sendKeys(newName);
    this.build.get().click();
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
