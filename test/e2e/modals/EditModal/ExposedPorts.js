'use strict';

var util = require('../../helpers/util');

function ExposedPorts (modal) {
  var wrappingElement = util.createGetter(by.css('div[ng-include="\'viewFormPorts\'"]'));

  this.clearPorts = function () {
    modal.waitForLoaded();
    var inputElement = wrappingElement.get().element(by.css('js-tag input.jt-tag-new'));
    modal.goTo('Exposed Ports');
    inputElement.sendKeys(
      protractor.Key.BACK_SPACE,
      protractor.Key.BACK_SPACE,
      protractor.Key.BACK_SPACE,
      protractor.Key.BACK_SPACE,
      protractor.Key.BACK_SPACE,
      protractor.Key.BACK_SPACE,
      protractor.Key.BACK_SPACE,
      protractor.Key.BACK_SPACE,
      protractor.Key.BACK_SPACE,
      protractor.Key.BACK_SPACE,
      protractor.Key.BACK_SPACE,
      protractor.Key.BACK_SPACE,
      protractor.Key.BACK_SPACE,
      protractor.Key.BACK_SPACE,
      protractor.Key.BACK_SPACE
    );
  };

  this.addPort =  function (port) {
    modal.waitForLoaded();
    var inputElement = wrappingElement.get().element(by.css('js-tag input.jt-tag-new'));
    modal.goTo('Exposed Ports')
    inputElement.sendKeys(port, protractor.Key.ENTER);
  };
}

module.exports = ExposedPorts;