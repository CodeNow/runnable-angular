var util = require('../helpers/util');

var GearMenu = require('../popovers/GearMenu');

function InstanceEditPage (instanceName) {
  this.gearMenu = new GearMenu();

  this.get = function() {
    // We need to create a new build each time, thus the workaround
    browser.get('/runnable-doobie/' + instanceName);
    element(by.css('#wrapper > main > header > div.secondary-actions > button')).click();
    util.waitForUrl(InstanceEditPage.urlRegex);
  };
}

InstanceEditPage.urlRegex = new RegExp(util.processUrl('/runnable-doobie/' + util.regex.instanceName + '/edit/' + util.regex.objectId));

module.exports = InstanceEditPage;