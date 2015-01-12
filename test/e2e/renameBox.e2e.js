'use strict';

/**
 * Tests box renaming
 */

var util = require('./helpers/util');

var InstancePage = require('./pages/InstancePage');

describe('rename box', function() {
  it('should rename a running box', function() {
    var instance = new InstancePage('Test-0');
    instance.get();

    instance.gearMenu.renameBox('Test-Rename');

    browser.wait(function() {
      return instance.getName().then(function(name) {
        return name === 'Test-Rename';
      });
    });

    var newInstance = new InstancePage('Test-Rename');
    newInstance.get();

    expect(newInstance.getName()).toEqual('Test-Rename');
  });
});
