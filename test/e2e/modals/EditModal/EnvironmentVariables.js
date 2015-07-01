'use strict';

var util = require('../../helpers/util');
var FancySelect = require('../../helpers/FancySelect');

function ExposedPorts (modal) {
  var wrappingElement = util.createGetter(by.css('div[ng-include="\'viewFormEnvironmentVariables\'"]'));

  var insertButtonBy = by.cssContainingText('button', 'Insert an Elastic Hostname');


  this.addElastic =  function (varName, serverName) {
    modal.waitForLoaded();

    var insertButton = wrappingElement.get().element(insertButtonBy);
    modal.goTo('Environment Variables')
    insertButton.click();
    new FancySelect(by.css('button[placeholder^="hostname"]'))
      .selectOptionByStartsWith(serverName+'-staging');
    wrappingElement.get().element(by.css('.ace_editor textarea')).sendKeys(varName + '=');
    wrappingElement.get().element(by.buttonText('Insert Elastic Hostname')).click();
  };
}

module.exports = ExposedPorts;