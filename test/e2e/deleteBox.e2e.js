'use strict';

/**
 * Tests a user's onboarding experience
 * setup => running instance => delete
 */

var util = require('./helpers/util');

var users = require('./helpers/users');
var ServerCard = require('./components/serverCard');

var containers = ['web'];

describe('project deletion workflow', function () {
  var originalTimeout = 1000 * 10;
  beforeEach(function () {
    jasmine.getEnv().defaultTimeoutInterval  = 1000 * 60 * 3;
    return util.goToUrl('/' + browser.params.user + '/configure');
  });
  afterEach(function () {
    jasmine.getEnv().defaultTimeoutInterval = originalTimeout;
  });
  containers.forEach(function (container) {
    it('should delete container '+container, function () {
      var serverCard = new ServerCard(container);
      return serverCard.deleteContainer();
    });
  });
});
