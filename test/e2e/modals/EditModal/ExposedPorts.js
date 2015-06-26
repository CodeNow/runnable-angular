'use strict';

var util = require('../../helpers/util');

function ExposedPorts (modal) {
  var wrappingElement = util.createGetter(by.css('div[ng-include="\'viewFormPorts\'"]'));

  this.addPort =  function (port) {
    var self = this;
    return modal.waitForLoaded()
      .then(function () {
        var inputElement = wrappingElement.get().element(by.css('js-tag input.jt-tag-new'));
        return modal.goTo('Exposed Ports')
          .then(function () {
            return inputElement.click();
          })
          .then(function () {
            return inputElement.sendKeys(port, protractor.Key.ENTER);
          });
      });
  };
}

module.exports = ExposedPorts;