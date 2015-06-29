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
      return serverCard.open('Exposed Ports')
        .then(function () {
          return editModal.exposedPorts.clearPorts();
        })
        .then(function () {
          return editModal.exposedPorts.addPort(3001);
        })
        .then(function () {
          return editModal.environmentVariables.addElastic('mongo', 'mongodb');
        })
        .then(function () {
          return editModal.findAndReplace.addStringRule('process.env.WEB_CLIENT_HOSTNAME', 'web', {
            start: '"http://',
            end: ':3000"'
          });
        })
        .then(function () {
          editModal.save();
        })
        .then(function () {
          return serverCard.getStatusText('Exposed Ports');
        })
        .then(function (statusText) {
          expect(statusText).toContain(3001);
        })
        .then(function () {
          return serverCard.getStatusText('Environment Variables');
        })
        .then(function (statusText) {
          expect(statusText).toEqual('1 variable');
        })
        .then(function () {
          return serverCard.getStatusText('Find and Replace');
        })
        .then(function (statusText) {
          expect(statusText).toEqual('1 rule');
        });
    });
  });
  describe('configure web', function () {
    it('should configure the web server', function () {
      var serverCard = new ServerCard('web');
      var editModal = new EditModal();
      return serverCard.open('Exposed Ports')
        .then(function () {
          return editModal.exposedPorts.clearPorts();
        })
        .then(function () {
          return editModal.exposedPorts.addPort(3000);
        })
        .then(function () {
          return editModal.findAndReplace.addStringRule('api-staging-runnabledemo.runnableapp.com', 'api');
        })
        .then(function () {
          editModal.save();
        })
        .then(function () {
          return serverCard.getStatusText('Exposed Ports');
        })
        .then(function (statusText) {
          expect(statusText).toContain(3000);
        })
        .then(function () {
          return serverCard.getStatusText('Find and Replace');
        })
        .then(function (statusText) {
          expect(statusText).toEqual('1 rule');
        });
    });
  });
});
