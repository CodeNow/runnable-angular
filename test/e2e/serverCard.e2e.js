'use strict';

var util = require('./helpers/util');

var ServerCard = require('./components/serverCard');
var EditModal = require('./modals/EditModal');

describe('server card', function () {
  util.testTimeout(1000 * 60 * 3);
  beforeEach(function () {
    return util.goToUrl('/' + browser.params.user + '/configure');
  });
  describe('exposed ports', function () {
    it('should be able to add a port to api', function () {
      var serverCard = new ServerCard('api');
      var editModal = new EditModal();
      return serverCard.open('Exposed Ports')
        .then(function () {
          return editModal.exposedPorts.addPort(3001);
        })
        .then(function () {
          editModal.save();
        })
        .then(function () {
          return serverCard.getStatusText('Exposed Ports');
        })
        .then(function (statusText) {
          expect(statusText).toContain(3001);
        });
    });
  });


  describe('Environment Variables', function () {
    it('should be able to add a mapping to the elastic hostname', function () {
      var serverCard = new ServerCard('api');
      var editModal = new EditModal();
      return serverCard.open('Environment Variables')
        .then(function () {
          return editModal.environmentVariables.addElastic('mongo', 'mongodb');
        })
        .then(function () {
          editModal.save();
        })
        .then(function () {
          return serverCard.getStatusText('Environment Variables');
        })
        .then(function (statusText) {
          expect(statusText).toEqual('1 variable');
        });
    });
  });

  describe('Find and Replace', function () {
    it('should create a find and replace rule', function () {
      var serverCard = new ServerCard('api');
      var editModal = new EditModal();
      return serverCard.open('Find and Replace')
        .then(function () {

          return editModal.findAndReplace.addStringRule('process.env.WEB_CLIENT_HOSTNAME', 'web', {
            start: '"',
            end: ':3000"'
          });
        })
        .then(function () {
          editModal.save();
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
