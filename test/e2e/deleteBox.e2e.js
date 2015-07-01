'use strict';

/**
 * Tests a user's onboarding experience
 * setup => running instance => delete
 */

var util = require('./helpers/util');

var ServerCard = require('./components/serverCard');

var containers = [
  'web',
  'api',
  'MongoDB'
];

describe('project deletion workflow', function () {
  util.testTimeout(1000 * 60 * 3);
  beforeEach(function () {
    return util.goToUrl('/' + browser.params.user + '/configure');
  });
  containers.forEach(function (container) {
    it('should delete container '+container, function () {
      var serverCard = new ServerCard(container);
      return serverCard.deleteContainer();
    });
  });
});
