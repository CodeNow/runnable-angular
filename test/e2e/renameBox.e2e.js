'use strict';

/**
 * Tests box renaming
 */

var util = require('./helpers/util');

var InstancePage = require('./pages/InstancePage');

var users = require('./helpers/users');

describe('rename box', users.doMultipleUsers(function(username) {
  it('should rename a running box owned by ' + username, function() {

    var instance = new InstancePage('RailsProject');
    instance.get();
    instance.openEditModal();
    var instanceEdit = instance.modalEdit;

    instanceEdit.renameBox('Test-Rename');

    browser.wait(function () {
      return util.hasClass(instance.statusIcon, 'running');
    });

    var newInstance = new InstancePage('Test-Rename');
    newInstance.get();

    expect(newInstance.getName()).toEqual('Test-Rename');
  });
}));
