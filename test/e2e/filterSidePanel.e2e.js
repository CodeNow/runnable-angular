'use strict';

var util = require('./helpers/util');

var InstancePage = require('./pages/InstancePage');
var users = require('./helpers/users');

describe('filter side panel', users.doMultipleUsers(function (username) {
  it('should filter the side panel when looking at instance: ' + username, function() {
    var instancePage = new InstancePage('node_hello_world');
    instancePage.get();

    util.waitForUrl(InstancePage.urlRegex());

    instancePage.instanceList.searchForInstance('SACESHIP');

    expect(instancePage.instanceList.getFilteredInstances().count()).toEqual(1);

    instancePage.instanceList.searchForInstance('');
  });
}));
