'use strict';

// injector-provided
var $compile;
var $state;
var $document;
var $timeout;
var $scope;
var $elScope;
var $controller;
var $rootScope;
var $templateCache;
var DEFAULT_MESSAGE = 'Join me on Runnable, where we can run the code in CodeNow’s repositories on demand.\n\nI need your admin permissions to enable some features. Thanks!';

describe('InviteAdminModalController'.bold.underline.blue, function () {
  var ctx;
  var IAMC;

  beforeEach(function () {
    IAMC = null;
    ctx = {};
    ctx.admins = {};
    ctx.fetchGitHubAdminsByRepoMock = sinon.stub();
    ctx.closeMock = sinon.stub();
    ctx.errsMock = {
      handler: sinon.spy()
    };
  });
  describe('Functionality', function () {
    function injectSetupCompile(instance, isFromAutoDeploy, githubFetchFailError) {
      angular.mock.module('app', function ($provide) {
        $provide.factory('fetchGitHubAdminsByRepo', function ($q) {
          var returnVal = githubFetchFailError ? $q.reject(githubFetchFailError) : $q.when(ctx.admins);
          ctx.fetchGitHubAdminsByRepoMock.returns(returnVal);
          return ctx.fetchGitHubAdminsByRepoMock;
        });
        $provide.value('$state', {
          params: {
            userName: 'fakeUser1'
          }
        });
        $provide.value('errs', ctx.errsMock);
      });
      angular.mock.inject(function (
        _$rootScope_,
        _$compile_,
        _$document_,
        _$timeout_,
        _$controller_,
        _$templateCache_
      ) {
        $scope = _$rootScope_.$new();
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
        $controller = _$controller_;
        $templateCache = _$templateCache_;
      });
      var laterController = $controller('InviteAdminModalController', {
        instance: instance,
        isFromAutoDeploy: isFromAutoDeploy || false,
        close: ctx.closeMock
      }, true);
      IAMC = laterController();

      $rootScope.$digest();

    }

    describe('on creation', function () {
      it('should set properties, and fetch data', function () {
        var instance = {
          id: 'hello',
          getRepoName: sinon.spy(function () {
            return 'checkmate';
          })
        };
        ctx.admins.hello = {
          login: 'hello',
          id: 123
        };
        injectSetupCompile(instance, false);
        expect(IAMC.close, 'close').to.be.function;
        expect(IAMC.close, 'close').to.equal(ctx.closeMock);
        expect(IAMC.isFromAutoDeploy, 'isFromAutoDeploy').to.equal(false);
        expect(IAMC.DEFAULT_MESSAGE, 'DEFAULT_MESSAGE').to.be.string;
        sinon.assert.calledOnce(instance.getRepoName);
        expect(IAMC.repoName, 'repoName').to.eql('checkmate');

        sinon.assert.calledOnce(ctx.fetchGitHubAdminsByRepoMock);
        sinon.assert.calledWith(ctx.fetchGitHubAdminsByRepoMock, 'fakeUser1', 'checkmate');
        expect(IAMC.repoName, 'repoName').to.eql('checkmate');

        expect(IAMC.admins, 'admins').to.eql(ctx.admins);
      });


      it('should fail properly', function () {
        var instance = {
          id: 'hello',
          getRepoName: sinon.spy(function () {
            return 'checkmate';
          })
        };
        ctx.admins.hello = {
          login: 'hello',
          id: 123
        };
        var error = new Error('error');
        injectSetupCompile(instance, false, error);
        expect(IAMC.close, 'close').to.be.function;
        expect(IAMC.close, 'close').to.equal(ctx.closeMock);
        expect(IAMC.isFromAutoDeploy, 'isFromAutoDeploy').to.equal(false);
        expect(IAMC.DEFAULT_MESSAGE, 'DEFAULT_MESSAGE').to.be.string;

        sinon.assert.calledOnce(ctx.errsMock.handler);
        sinon.assert.calledOnce(ctx.closeMock);
        expect(IAMC.repoName, 'repoName').to.eql('checkmate');

        sinon.assert.calledOnce(ctx.fetchGitHubAdminsByRepoMock);
        sinon.assert.calledWith(ctx.fetchGitHubAdminsByRepoMock, 'fakeUser1', 'checkmate');
        expect(IAMC.repoName, 'repoName').to.eql('checkmate');

        expect(IAMC.admins, 'admins').to.be.undefined
      });
    });

    describe('selectUser', function () {
      it('should select the user', function() {
        var instance = {
          id: 'hello',
          getRepoName: sinon.spy(function () {
            return 'checkmate';
          })
        };
        ctx.admins.hello = {
          login: 'hello',
          id: 123
        };
        injectSetupCompile(instance, false);
        IAMC.selectUser(ctx.admins.hello);

        expect(ctx.admins.hello.emailMessage, 'emailMessage').to.eql(DEFAULT_MESSAGE);
        expect(IAMC.activeItem, 'activeItem').to.eql('hello');
      });
    });

    describe('sendEmail', function () {
      it('should set the correct properties on the user', function() {
        var instance = {
          id: 'hello',
          getRepoName: sinon.spy(function () {
            return 'checkmate';
          })
        };
        ctx.admins.hello = {
          login: 'hello',
          id: 123
        };
        injectSetupCompile(instance, false);
        IAMC.sendEmail(ctx.admins.hello);
        expect(IAMC.sending, 'sending').to.be.true;

        $timeout.flush(2000);
        expect(IAMC.sending, 'sending').to.be.false;
        expect(IAMC.activeItem, 'activeItem').to.be.null;
        expect(ctx.admins.hello.emailSent, 'emailSent').to.be.true;
      });
    });
  });
});