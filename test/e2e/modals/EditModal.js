'use strict';

var util = require('../helpers/util');
var ExposedPorts = require('./EditModal/ExposedPorts');
var EnvironmentVariables = require('./EditModal/EnvironmentVariables');
var FindAndReplace = require('./EditModal/FindAndReplace');

function EditModal () {
  var self = this;

  this.modalElem = util.createGetter(by.css('.modal-edit'));

  this.waitForLoaded = function() {
    var self = this;
    return browser.wait(function () {
      return self.modalElem.get().getAttribute('class')
        .then(function (classes) {
          return classes.indexOf('disabled') === -1;
        });
    }, 1000 * 20);
  };

  this.goTo = function (tab) {
    return self.waitForLoaded()
      .then(function () {
        element(by.cssContainingText('header .modal-tabs button .btn-text', tab))
          .element(by.xpath('..'))
          .click();
      });
  };

  this.exposedPorts = new ExposedPorts(this);
  this.environmentVariables = new EnvironmentVariables(this);
  this.findAndReplace = new FindAndReplace(this);

  this.save = function () {
    return self.waitForLoaded()
      .then(function () {
        return element(by.css('footer button.green')).click();
      });
  };

}

module.exports = EditModal;