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
var $q;
var $templateCache;

describe.skip('EnableBranchesModalController'.bold.underline.blue, function () {
  var ctx;
  var EBMC;

  beforeEach(function () {
    EBMC = null;
    ctx = {};
    ctx.closeMock = sinon.stub();
    ctx.errsMock = {
      handler: sinon.spy()
    };
    ctx.promisifyMock = null;
    ctx.loadingMock = sinon.spy();
  });
  describe('Functionality', function () {
    function injectSetupCompile(instance) {
      angular.mock.module('app', function ($provide) {
        $provide.value('$state', {
          params: {
            userName: 'fakeUser1'
          }
        });
        $provide.value('errs', ctx.errsMock);
        $provide.value('loading', ctx.loadingMock);
        $provide.factory('promisify', function ($q) {
          ctx.promisifyMock = sinon.spy(function (obj, key) {
            return function () {
              return $q.when(obj[key].apply(obj, arguments));
            };
          });
          return ctx.promisifyMock;
        });
      });
      angular.mock.inject(function (
        _$rootScope_,
        _$compile_,
        _$document_,
        _$timeout_,
        _$controller_,
        _$templateCache_,
        _$q_
      ) {
        $scope = _$rootScope_.$new();
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
        $controller = _$controller_;
        $templateCache = _$templateCache_;
        $q = _$q_;
      });
      var laterController = $controller('EnableBranchesModalController', {
        instance: instance,
        close: ctx.closeMock
      }, true);
      EBMC = laterController();

      $rootScope.$digest();

    }
    var instance;
    beforeEach(function () {
      instance = {
        id: 'hello',
        update: sinon.stub(),
        getMasterPodName: sinon.stub().returns('checkmate')
      };

      injectSetupCompile(instance);
    });

    describe('on creation', function () {
      it('should set properties', function () {
        expect(EBMC.close, 'close').to.be.function;
        expect(EBMC.close, 'close').to.equal(ctx.closeMock);
        sinon.assert.calledOnce(instance.getMasterPodName);
        expect(EBMC.instanceName, 'instanceName').to.eql('checkmate');
        expect(EBMC.instance, 'instance').to.eql(instance);
      });
    });

    describe('enableBranches', function () {
      it('should perform update', function () {
        var deferedUpdate = $q.defer();
        instance.update.returns(deferedUpdate.promise);

        EBMC.enableBranches();
        sinon.assert.calledOnce(instance.update);
        sinon.assert.calledWith(instance.update, {
          enableBranches: true
        });
        sinon.assert.calledOnce(ctx.closeMock);
        expect(ctx.closeMock.args[0].length, 'close args count').to.eql(1);
        sinon.assert.calledOnce(ctx.loadingMock);
        sinon.assert.calledWith(ctx.loadingMock, 'main', true);
        deferedUpdate.resolve();
        $rootScope.$digest();
        sinon.assert.calledTwice(ctx.loadingMock);
        sinon.assert.calledWith(ctx.loadingMock, 'main', false);
      });
      it('should alert the user on error', function () {
        var deferedUpdate = $q.defer();
        instance.update.returns(deferedUpdate.promise);

        EBMC.enableBranches();
        sinon.assert.calledOnce(instance.update);
        sinon.assert.calledWith(instance.update, {
          enableBranches: true
        });
        sinon.assert.calledOnce(ctx.closeMock);
        expect(ctx.closeMock.args[0].length, 'close args count').to.eql(1);
        sinon.assert.calledOnce(ctx.loadingMock);
        sinon.assert.calledWith(ctx.loadingMock, 'main', true);
        var error = new Error('error');
        deferedUpdate.reject(error);
        $rootScope.$digest();
        sinon.assert.calledOnce(ctx.errsMock.handler);
        sinon.assert.calledTwice(ctx.loadingMock);
        sinon.assert.calledWith(ctx.loadingMock, 'main', false);
      });
    });
  });
});
