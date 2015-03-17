'use strict';

/**
 * Tests box renaming
 */

var util = require('./helpers/util');

var InstancePage = require('./pages/InstancePage');

var users = require('./helpers/users');

describe('rename box', users.doMultipleUsers(function(username) {
  it('should rename a running box', function() {
    var instance = new InstancePage('Node-Hello-World');
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
}));
