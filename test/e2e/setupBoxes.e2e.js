'use strict';

var util = require('./helpers/util');

var ServerCard = require('./components/serverCard');
var EditModal = require('./modals/EditModal');

describe('setup boxes using server card', function () {
  util.testTimeout(1000 * 60 * 3);
  beforeEach(function () {
    return util.goToUrl('/' + browser.params.user + '/configure');
  });

  describe('configure api', function () {
    it('should configure api', function () {
      var serverCard = new ServerCard('api');
      var editModal = new EditModal();
      serverCard.open('Exposed Ports');
      editModal.exposedPorts.clearPorts();
      editModal.exposedPorts.addPort(3001);
      editModal.environmentVariables.addElastic('mongo', 'mongodb');
      editModal.findAndReplace.addStringRule('process.env.WEB_CLIENT_HOSTNAME', 'web', {
        start: '"http://',
        end: ':3000"'
      });
      editModal.save();
      expect(serverCard.getStatusText('Exposed Ports')).toContain(3001);
      expect(serverCard.getStatusText('Environment Variables')).toEqual('1 variable');
      expect(serverCard.getStatusText('Find and Replace')).toEqual('1 rule');
    });
  });
  describe('configure web', function () {
    it('should configure the web server', function () {
      var serverCard = new ServerCard('web');
      var editModal = new EditModal();
      serverCard.open('Exposed Ports');
      editModal.exposedPorts.clearPorts();
      editModal.exposedPorts.addPort(3000);
      editModal.findAndReplace.addStringRule('api-staging-runnabledemo.runnableapp.com', 'api');
      editModal.save();
      expect(serverCard.getStatusText('Exposed Ports')).toContain(3000);
      expect(serverCard.getStatusText('Find and Replace')).toEqual('1 rule');
    });
  });
});
