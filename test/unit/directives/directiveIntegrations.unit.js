'use strict';

var $rootScope;
var $elScope;
var $compile;
var $state;
var $scope;

var mockSlack = [{
    real_name: 'bill',
    id: 'snacks',
    found: true,
    ghName: 'bill'
  }, {
    real_name: 'bob',
    id: 'not snacks'
  }, {
    real_name: 'valentina',
    id: 'hullo',
    slackOn: true,
    found: true,
    ghName: 'valentina'
  }];
var mockGithub = ['jeb'];

describe('directiveIntegrations', function () {
  var errs, promise, $q, vciSpy;

  function injectSetupCompile (mockSettings, triggerErrorOnVerifyChatIntegration) {
    var errsFactory = function () {
      errs = {
        handler: sinon.spy(function (err) {
          return;
        })
      };
      return errs;
    };
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchSettings', function ($q) {
        return function () {
          return $q.when(mockSettings);
        };
      });
      $provide.factory('verifyChatIntegration', function ($q) {
        // Need to do this dance so we can access the spy
        if (triggerErrorOnVerifyChatIntegration === true)  {
          promise = $q.reject(new Error('Testing erorr handling'));
        } else {
          promise = $q.when({
            github: mockGithub,
            slack: mockSlack
          });
        }
        vciSpy = sinon.spy(function () {
          return promise;
        });
        return vciSpy;
      });
      $provide.factory('errs', errsFactory);
    });
    angular.mock.inject(function (
      _$compile_,
      _$rootScope_,
      _$state_,
      _$q_
    ) {
      $compile = _$compile_;
      $state = _$state_;
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      $q = _$q_;
    });

    var template = directiveTemplate.attribute('modal-integrations');
    var element = $compile(angular.element(template))($scope);
    $scope.$digest();
    $elScope = element.scope();
  }

  it('should not do much without settings', function () {
    injectSetupCompile({});
    $rootScope.$apply();
    expect($elScope.data.slackMembers).to.deep.equal({});
  });

  describe('with settings', function () {
    var settings;
    beforeEach(function () {
      settings = {
        attrs: {
          notifications: {
            slack: {
              apiToken: 'runnable123',
              githubUsernameToSlackIdMap: {}
            }
          }
        },
        update: sinon.spy(function (datums, cb) {
          cb();
        })
      };
      injectSetupCompile(settings);
      $rootScope.$apply();
    });

    it('should fetch chat data when there is a token & map', function () {
      expect($elScope.data.verified).to.be.true;
      expect($elScope.data.slackMembers).to.deep.equal(mockSlack);
      expect($elScope.data.ghMembers).to.deep.equal(mockGithub);
      sinon.assert.called(vciSpy);
    });

    it('should call fetchChatMemberData on verify click', function () {
      $elScope.actions.verifySlack();
      $rootScope.$apply();
      sinon.assert.called(vciSpy);
    });

    it('should send correctly-formatted data on save', function () {
      $elScope.actions.saveSlack();
      $rootScope.$apply();
      sinon.assert.calledWith(settings.update, {
        json: {
          notifications: {
            slack: {
              apiToken: 'runnable123',
              enabled: undefined,
              githubUsernameToSlackIdMap: {
                bill: null,
                valentina: 'hullo'
              }
            }
          }
        }
      });
    });
    it('should correctly map the GitHub username to the Slack username', function () {
      $elScope.data.slackMembers = [
        {
          ghName: 'thejsj',
          found: false,
          slackOn: true,
          id: 1
        }
      ];
      $elScope.actions.saveSlack();
      $rootScope.$apply();
      $scope.$digest();
      sinon.assert.calledWith(settings.update, {
        json: {
          notifications: {
            slack: {
              apiToken: "runnable123",
              enabled: undefined,
              githubUsernameToSlackIdMap: {
                thejsj: 1
              }
            }
          }
        }
      });
    });
  });

  describe('error handling', function () {

    before(function () {
      promise = $q.reject(new Error('Testing erorr handling'));
    });

    it('should handle errors correctly', function () {
      promise = $elScope.actions.verifySlack();
      $rootScope.$apply();
      $scope.$digest();
      expect(errs.handler.calledOnce).to.be.true;
    });
  });

  describe('$destroy', function () {

    var settings = {
      attrs: {
        notifications: {
          slack: {
            apiToken: 'valid_api_token',
            githubUsernameToSlackIdMap: {}
          }
        }
      }
    };

    describe('Reset invalid API token', function () {

      beforeEach(function () {
        injectSetupCompile(settings, true);
        $rootScope.$apply();
      });

      it('should reset an invalid Slack API token when destroyed', function () {
        var apiToken = $elScope.data.settings.attrs.notifications.slack.apiToken;
        $elScope.data.slackApiToken = 'NOT_VALID';
        var invalidApiToken = $elScope.data.slackApiToken;
        expect(apiToken).not.to.equal(invalidApiToken);
        $scope.$digest();
        $elScope.actions.verifySlack();
        $scope.$digest();
        var newApiToken = $elScope.data.settings.attrs.notifications.slack.apiToken;
        expect(apiToken).to.equal(newApiToken);
        expect(invalidApiToken).to.not.equal(newApiToken);
      });

    });

    describe('Dont reset invalid API token', function () {

      beforeEach(function () {
        injectSetupCompile(settings, false);
        $rootScope.$apply();
      });

      it('should reset an invalid Slack API token when destroyed', function () {
        var apiToken = $elScope.data.settings.attrs.notifications.slack.apiToken;
        $elScope.data.slackApiToken = 'NOT_VALID';
        var validApiToken = $elScope.data.slackApiToken;
        expect(apiToken).not.to.equal(validApiToken);
        $scope.$digest();
        $elScope.actions.verifySlack();
        $scope.$digest();
        $scope.$digest();
        var newApiToken = $elScope.data.settings.attrs.notifications.slack.apiToken;
        expect(apiToken).to.not.equal(newApiToken);
        expect(validApiToken).to.equal(newApiToken);
      });

    });

  });

});
