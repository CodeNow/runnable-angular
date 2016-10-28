'use strict';

var $rootScope,
  $scope;
var element;
var $compile;
var keypather;
var $q;
var $elScope;
var readOnlySwitchController;
var apiMocks = require('./../../../apiMocks/index');

describe('serverModalButtonsDirective'.bold.underline.blue, function () {
  var ctx;

  beforeEach(function () {
    ctx = {};
  });

  beforeEach(function () {
    ctx.errsMock = {
      handler: sinon.spy()
    };
    ctx.serverModalController = {
      name: 'editServerModal',
      instance: ctx.instance,
      updateInstanceAndReset: sinon.stub(),
      createServer: sinon.stub(),
      changeTab: sinon.stub(),
      state: {
        contextVersion: ctx.cv
      },
      isDirty: sinon.stub()
    };

    ctx.loadingMock = sinon.spy();
    angular.mock.module('app', function ($provide) {
      $provide.value('errs', ctx.errsMock);
      $provide.value('loading', ctx.loadingMock);
    });
    angular.mock.inject(function (_$compile_, _$timeout_, _$rootScope_, _$q_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $scope = $rootScope.$new();
      $q = _$q_;
      $rootScope.featureFlags = {};
      $rootScope.isLoading = {};
      var template = directiveTemplate.attribute('server-modal-buttons', {
        'this-form': 'thisForm',
        'is-primary-button-disabled': 'false',
        'server-modal-controller': 'serverModalController'
      });
      $scope.thisForm = {};
      $scope.serverModalController = ctx.serverModalController;
      element = $compile(template)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  });
  describe('showSaveAndBuild', function () {
    describe('with steps', function () {
      it('should be true when steps are less than 4, and no instance', function () {
        ctx.serverModalController.state.step = 3;
        ctx.serverModalController.isDirty.returns(false);
        $rootScope.isLoading.editServerModal = true;
        expect($elScope.showSaveAndBuild(), 'showSaveAndBuild').to.be.true;
      });
      it('should be false when steps are 4, and no instance', function () {
        ctx.serverModalController.state.step = 4;
        ctx.serverModalController.isDirty.returns(false);
        $rootScope.isLoading.editServerModal = true;
        expect($elScope.showSaveAndBuild(), 'showSaveAndBuild').to.be.false;
      });
    });

    describe('without steps', function () {
      beforeEach(function () {
        ctx.serverModalController.instance = {};
      });
      it('should be false when an instance exists, dirty state is update, and isLoading', function () {
        ctx.serverModalController.isDirty.returns('update');
        $rootScope.isLoading.editServerModal = true;
        expect($elScope.showSaveAndBuild(), 'showSaveAndBuild').to.be.false;
      });
      it('should be false when an instance exists, dirty state is false, and isLoading', function () {
        ctx.serverModalController.isDirty.returns(false);
        $rootScope.isLoading.editServerModal = true;
        expect($elScope.showSaveAndBuild(), 'showSaveAndBuild').to.be.false;
      });
      it('should be false when an instance exists, dirty state is build, and isLoading', function () {
        ctx.serverModalController.isDirty.returns('build');
        $rootScope.isLoading.editServerModal = true;
        expect($elScope.showSaveAndBuild(), 'showSaveAndBuild').to.be.false;
      });
      it('should be true when an instance exists, dirty state is build, and !isLoading', function () {
        ctx.serverModalController.isDirty.returns('build');
        $rootScope.isLoading.editServerModal = false;
        expect($elScope.showSaveAndBuild(), 'showSaveAndBuild').to.be.true;
      });
    });
  });
  describe('createServerOrUpdate', function () {
    it('should return immidiately if primary button is disabled', function () {
      $elScope.isPrimaryButtonDisabled = sinon.stub().returns(true);
      $elScope.createServerOrUpdate();
      $scope.$digest();
      sinon.assert.notCalled(ctx.loadingMock);
    });
    describe('failures', function () {
      it('should fail safely', function () {
        var error = new Error('I am an error!');
        ctx.serverModalController.createServer.returns($q.reject(error));
        ctx.instance = null;
        ctx.cv = {
          id: 'hello'
        };
        ctx.serverModalController.state.contextVersion = ctx.cv;

        $elScope.createServerOrUpdate();

        $scope.$digest();
        sinon.assert.callCount(ctx.loadingMock, 2);
        sinon.assert.calledWith(ctx.loadingMock.firstCall, 'editServerModal', true);

        sinon.assert.calledOnce(ctx.serverModalController.createServer);
        sinon.assert.notCalled(ctx.serverModalController.updateInstanceAndReset);

        sinon.assert.notCalled(ctx.serverModalController.changeTab);

        sinon.assert.calledWith(ctx.errsMock.handler, error);

        sinon.assert.calledWith(ctx.loadingMock.secondCall, 'editServerModal', false);
        $scope.$digest();
      });
    });
    describe('when not disabled', function () {
      it('should attempt to create the server when no instance exists', function () {
        ctx.serverModalController.createServer.returns($q.when(true));
        ctx.instance = null;
        ctx.cv = {
          id: 'hello'
        };
        ctx.serverModalController.state.contextVersion = ctx.cv;

        $elScope.createServerOrUpdate();

        ctx.instance = {
          id: 'hello',
          on: sinon.spy(),
          removeListener: sinon.spy()
        };
        ctx.serverModalController.instance = ctx.instance;
        $scope.$digest();
        sinon.assert.callCount(ctx.loadingMock, 2);
        sinon.assert.calledWith(ctx.loadingMock.firstCall, 'editServerModal', true);

        sinon.assert.calledOnce(ctx.serverModalController.createServer);
        sinon.assert.notCalled(ctx.serverModalController.updateInstanceAndReset);

        sinon.assert.calledOnce(ctx.serverModalController.changeTab);
        sinon.assert.calledWith(ctx.serverModalController.changeTab, 'logs');

        sinon.assert.calledWith(ctx.loadingMock.secondCall, 'editServerModal', false);
        $scope.$digest();
      });
      it('should attempt to update the server when an instance exists', function () {
        ctx.serverModalController.updateInstanceAndReset.returns($q.when(true));
        ctx.instance = {
          id: 'hello',
          on: sinon.spy(),
          removeListener: sinon.spy()
        };
        ctx.serverModalController.instance = ctx.instance;

        $elScope.createServerOrUpdate();

        $scope.$digest();
        sinon.assert.callCount(ctx.loadingMock, 2);
        sinon.assert.calledWith(ctx.loadingMock.firstCall, 'editServerModal', true);

        sinon.assert.notCalled(ctx.serverModalController.createServer);
        sinon.assert.calledOnce(ctx.serverModalController.updateInstanceAndReset);

        sinon.assert.calledOnce(ctx.serverModalController.changeTab);
        sinon.assert.calledWith(ctx.serverModalController.changeTab, 'logs');

        sinon.assert.calledWith(ctx.loadingMock.secondCall, 'editServerModal', false);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.instance.on);
      });
    });
  });
});
