'use strict';
var mockUserFetch = new (require('../../../fixtures/mockFetch.js'))();
var apiMocks = require('../../../apiMocks');
var generateUserObject = apiMocks.generateUserObject;
var generateTeammateInvitationObject = apiMocks.generateTeammateInvitationObject;
var generateGithubUserObject = apiMocks.gh.generateGithubUserObject;
var generateGithubOrgObject = apiMocks.gh.generateGithubOrgObject;

var $rootScope;
var $controller;
var $scope;
var $q;
var keypather;

describe('SlackIntegrationFormController'.bold.underline.blue, function () {

  var SIFC;
  var fetchChatMembersAndMapToUsersStub;
  var fetchSettingsStub;
  var settingsModelStub;
  var errs;

  beforeEach(function () {
    settingsModelStub = {
      update: sinon.spy(function (opts, cb) {
        if (settingsModelStub._throwErrorWhenUpdating) {
          $rootScope.$evalAsync(function () {
            cb(new Error('Could not update settings'), null);
          });
          return settingsModelStub;
        }
        angular.extend(settingsModelStub.attrs.notifications.slack, opts.json.notifications.slack);
        $rootScope.$evalAsync(function () {
          cb(null, settingsModelStub);
        });
        return settingsModelStub;
      }),
      _throwErrorWhenUpdating: false,
      attrs: {
        notifications: {
          slack: {
            apiToken: null,
            enabled: true
          }
        }
      }
    };
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchChatMembersAndMapToUsers', function ($q) {
        var members = {};
        members.slack = [
          {
            id: 30,
            ghName: 'thejsj',
            found: true,
            slackOn: true
          },
          {
            id: 40,
            ghName: 'hiphipjorge',
            found: false,
            slackOn: true
          }, {
             id: 50,
             ghName: 'hello',
             found: false,
             slackOn: false
          }
        ];
        members.github = [
          generateGithubUserObject('thejsj', 1),
          generateGithubUserObject('hiphipjorge', 2)
        ];
        fetchChatMembersAndMapToUsersStub = sinon.stub().returns($q.when(members));
        return fetchChatMembersAndMapToUsersStub;
      });
      $provide.factory('fetchSettings', function ($q) {
        fetchSettingsStub = sinon.stub().returns($q.when(settingsModelStub));
        return fetchSettingsStub;
      });
      $provide.factory('debounce', function () {
        // Just return the function
        var func = function (func) {
          return func;
        };
        return func;
      });
      $provide.factory('errs', function () {
        errs = {
          handler: sinon.stub()
        };
        return errs;
      });
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$q_,
      _keypather_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $q = _$q_;
      keypather = _keypather_;
    });
    SIFC = $controller('SlackIntegrationFormController', { $scope: $scope }, true)();
  });

  describe('Init', function () {

    it('should fetch settings on init', function () {
      $scope.$digest();
      sinon.assert.calledOnce(fetchSettingsStub);
      expect(SIFC).to.be.an('object');
    });

    it('should fetch the member data if there is a Slack API token', function () {
      settingsModelStub.attrs.notifications.slack.apiToken = '123';

      $scope.$digest();
      expect(SIFC.slackApiToken).to.equal('123');
      sinon.assert.calledOnce(fetchChatMembersAndMapToUsersStub);
      expect(SIFC.state).to.equal('verified');
      expect(SIFC.ghMembers).to.be.an('array');
      expect(SIFC.slackMembers).to.be.an('array');
    });

    it('should not fetch the member data if there is no Slack API token', function () {
      settingsModelStub.attrs.notifications.slack.apiToken = null;

      expect(SIFC.slackApiToken).to.equal(null);
      $scope.$digest();
      sinon.assert.notCalled(fetchChatMembersAndMapToUsersStub);
      expect(SIFC.state).to.not.equal('verified');
    });

    it('should not be verified if the the API token is not valid', function () {
      fetchChatMembersAndMapToUsersStub.returns($q.reject(new Error('Provided API key is invalid')));
      settingsModelStub.attrs.notifications.slack.apiToken = '123';

      $scope.$digest();
      expect(SIFC.slackApiToken).to.equal('123');
      sinon.assert.calledOnce(fetchChatMembersAndMapToUsersStub);
      // It shouldn't show the error message to the user
      sinon.assert.notCalled(errs.handler);
      expect(SIFC.state).to.not.equal('verified');
    });

  });

  describe('Verify Slack', function () {

    beforeEach(function () {
      SIFC.slackApiTokenForm = {
         $valid: true
      };
      $scope.$digest();
      SIFC.settings.update.reset();
    });

    it('should not run if the slackApiTokenForm is invaild', function () {
      SIFC.slackApiTokenForm.$valid = false;
      settingsModelStub.attrs.notifications.slack.apiToken = null;

      SIFC.verifySlack();
      $scope.$digest();
      sinon.assert.notCalled(fetchChatMembersAndMapToUsersStub);
      sinon.assert.notCalled(SIFC.settings.update);
      sinon.assert.notCalled(errs.handler);
      expect(SIFC.state).to.not.equal('verifying');
      expect(SIFC.state).to.not.equal('verified');
    });

    it('should not update the Slack settings if the API token is invalid', function () {
      fetchChatMembersAndMapToUsersStub.returns($q.reject(new Error('Provided API token is invalid')));

      SIFC.verifySlack();
      $scope.$digest();

      sinon.assert.calledOnce(fetchChatMembersAndMapToUsersStub);
      sinon.assert.notCalled(SIFC.settings.update);
      sinon.assert.notCalled(errs.handler);
      expect(SIFC.state).to.not.equal('verifying');
      expect(SIFC.state).to.not.equal('verified');
    });

    it('should not update the Slack settings and notify the user if there is some other error', function () {
      fetchChatMembersAndMapToUsersStub.returns($q.reject(new Error('Some other error')));

      SIFC.verifySlack();
      $scope.$digest();

      sinon.assert.calledOnce(fetchChatMembersAndMapToUsersStub);
      sinon.assert.notCalled(SIFC.settings.update);
      sinon.assert.calledOnce(errs.handler);
      expect(SIFC.state).to.not.equal('verifying');
      expect(SIFC.state).to.not.equal('verified');
    });


    it('should update the Slack settings if the API token is valid', function () {
      SIFC.slackApiToken = '456';

      sinon.assert.notCalled(SIFC.settings.update);
      SIFC.verifySlack();
      $scope.$digest();

      sinon.assert.calledOnce(fetchChatMembersAndMapToUsersStub);
      sinon.assert.calledOnce(SIFC.settings.update);
      sinon.assert.calledOnce(SIFC.settings.update);
      sinon.assert.calledWith(SIFC.settings.update, {
        json: {
          notifications: {
            slack: { apiToken: '456', enabled: true }
          }
        }
      });
      sinon.assert.notCalled(errs.handler);
      expect(SIFC.state).to.not.equal('verifying');
      expect(SIFC.state).to.equal('verified');
    });
  });

  describe('Delete Slack', function () {

    beforeEach(function () {
      $scope.$digest();
    });

    it('should delete the API token', function () {
      SIFC.deleteAPIToken();
      $scope.$digest();

      expect(SIFC.settings.attrs.notifications.slack.apiToken).to.equal('');
      sinon.assert.calledWith(SIFC.settings.update, {
        json: {
          notifications: {
            slack: { apiToken: '', enabled: true }
          }
        }
      });
    });

    it('should display an error and keep the token if it cant delete the token', function () {
      SIFC.slackApiToken = '456';
      SIFC.verified = true;
      SIFC.settings._throwErrorWhenUpdating = true;

      SIFC.deleteAPIToken();
      $scope.$digest();

      sinon.assert.calledOnce(errs.handler);
      expect(SIFC.slackApiToken).to.equal('456');
      expect(SIFC.verified).to.equal(true);
    });
  });

  describe('Save Slack', function () {

    beforeEach(function () {
      settingsModelStub.attrs.notifications.slack.apiToken = '123';
      $scope.$digest();
    });

    it('correctly map Slack members', function () {
      SIFC.saveSlack();
      $scope.$digest();
      sinon.assert.calledWith(SIFC.settings.update, {
        json: {
          notifications: {
            slack: {
              apiToken: '123',
              enabled: true,
              githubUsernameToSlackIdMap: {
                 thejsj: 30, // Autodetected
                 hiphipjorge: 40, // Selected by user in dropdown
                 hello: null // Entry with Github name
              }
            }
          }
        }
      });
    });
  });

});
