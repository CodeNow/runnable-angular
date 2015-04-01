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

describe.only('directiveIntegrations', function () {
  var ctx;
  function injectSetupCompile (mockSettings) {
    ctx = {};
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchSettings', function ($q) {
        return function () {
          return $q.when(mockSettings);
        };
      });
      $provide.factory('verifyChatIntegration', function ($q) {
        return function () {
          return $q.when({
            github: mockGithub,
            slack: mockSlack
          });
        };
      });
    });
    angular.mock.inject(function (
      _$compile_,
      _$rootScope_,
      _$state_
    ) {
      $compile = _$compile_;
      $state = _$state_;
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
    });

    ctx.template = directiveTemplate.attribute('modal-integrations');

    ctx.element = angular.element(ctx.template);
    ctx.element = $compile(ctx.element)($scope);
    $scope.$digest();
    $elScope = ctx.element.scope();
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
    });

    it('should re-verify on verify click', function () {

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
  });

});