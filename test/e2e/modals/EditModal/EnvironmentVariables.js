'use strict';

var util = require('../../helpers/util');
var FancySelect = require('../../helpers/FancySelect');

function ExposedPorts (modal) {
  var wrappingElement = util.createGetter(by.css('div[ng-include="\'viewFormEnvironmentVariables\'"]'));

  var insertButtonBy = by.cssContainingText('button', 'Insert an Elastic Hostname');


  this.addElastic =  function (varName, serverName) {
    return modal.waitForLoaded()
      .then(function () {
        var insertButton = wrappingElement.get().element(insertButtonBy);
        return modal.goTo('Environment Variables')
          .then(function () {
            return insertButton.click();
          })
          .then(function () {
            return new FancySelect(by.css('button[placeholder^="hostname"]'))
              .selectOptionByStartsWith(serverName+'-staging');
          })
          .then(function () {
            return wrappingElement.get().element(by.css('.ace_editor textarea')).sendKeys(varName + '=');
          })
          .then(function () {
            wrappingElement.get().element(by.buttonText('Insert Elastic Hostname')).click();
          });
      });
  };
}

module.exports = ExposedPorts;