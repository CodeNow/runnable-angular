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
      createServerAndReset: sinon.stub(),
      changeTab: sinon.stub(),
      state: {
        contextVersion: ctx.cv
      }
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
  describe('isBuilding', function () {
    it('should return false if both isLoading[name + isBuilding] and isLoading[name] are false', function () {
      $rootScope.isLoading.editServerModalisBuilding = false;
      $rootScope.isLoading.editServerModal = false;
      expect($elScope.isBuilding(), 'isBuilding').to.be.false;
    });
    it('should return true if isLoading[name + isBuilding] is true', function () {
      $rootScope.isLoading.editServerModalisBuilding = true;
      $rootScope.isLoading.editServerModal = false;
      expect($elScope.isBuilding(), 'isBuilding').to.be.true;
    });
    it('should return true if isLoading[name] is true', function () {
      $rootScope.isLoading.editServerModalisBuilding = false;
      $rootScope.isLoading.editServerModal = true;
      expect($elScope.isBuilding(), 'isBuilding').to.be.true;
    });
  });
  describe('createServerAndResetOrUpdate', function () {
    it('should return immidiately if primary button is disabled', function () {
      $elScope.isPrimaryButtonDisabled = sinon.stub().returns(true);
      $elScope.createServerOrUpdate();
      $scope.$digest();
      sinon.assert.notCalled(ctx.loadingMock);
    });
    describe('failures', function () {
      it('should fail safely', function () {
        var error = new Error('I am an error!');
        ctx.serverModalController.createServerAndReset.returns($q.reject(error));
        ctx.instance = null;
        ctx.cv = {
          id: 'hello'
        };
        ctx.serverModalController.state.contextVersion = ctx.cv;

        $elScope.createServerOrUpdate();

        $scope.$digest();
        sinon.assert.callCount(ctx.loadingMock, 4);
        sinon.assert.calledWith(ctx.loadingMock.firstCall, 'editServerModalisBuilding', true);
        sinon.assert.calledWith(ctx.loadingMock.secondCall, 'editServerModal', true);

        sinon.assert.calledOnce(ctx.serverModalController.createServerAndReset);
        sinon.assert.notCalled(ctx.serverModalController.updateInstanceAndReset);

        sinon.assert.notCalled(ctx.serverModalController.changeTab);

        sinon.assert.calledWith(ctx.errsMock.handler, error);

        sinon.assert.calledWith(ctx.loadingMock.thirdCall, 'editServerModalisBuilding', false);
        sinon.assert.calledWith(ctx.loadingMock.lastCall, 'editServerModal', false);
        $scope.$digest();
      });
    });
    describe('when not disabled', function () {
      it('should attempt to create the server when no instance exists', function () {
        ctx.serverModalController.createServerAndReset.returns($q.when(true));
        ctx.instance = null;
        ctx.cv = {
          id: 'hello'
        };
        ctx.serverModalController.state.contextVersion = ctx.cv;

        $elScope.createServerOrUpdate();

        $scope.$digest();
        sinon.assert.callCount(ctx.loadingMock, 4);
        sinon.assert.calledWith(ctx.loadingMock.firstCall, 'editServerModalisBuilding', true);
        sinon.assert.calledWith(ctx.loadingMock.secondCall, 'editServerModal', true);

        sinon.assert.calledOnce(ctx.serverModalController.createServerAndReset);
        sinon.assert.notCalled(ctx.serverModalController.updateInstanceAndReset);

        sinon.assert.calledOnce(ctx.serverModalController.changeTab);
        sinon.assert.calledWith(ctx.serverModalController.changeTab, 'logs');

        sinon.assert.calledWith(ctx.loadingMock.thirdCall, 'editServerModalisBuilding', false);
        sinon.assert.calledWith(ctx.loadingMock.lastCall, 'editServerModal', false);
        $scope.$digest();
      });
      it('should attempt to update the server when an instance exists', function () {
        ctx.serverModalController.updateInstanceAndReset.returns($q.when(true));
        ctx.instance = {
          id: 'hello'
        };
        ctx.serverModalController.instance = ctx.instance;

        $elScope.createServerOrUpdate();

        $scope.$digest();
        sinon.assert.callCount(ctx.loadingMock, 4);
        sinon.assert.calledWith(ctx.loadingMock.firstCall, 'editServerModalisBuilding', true);
        sinon.assert.calledWith(ctx.loadingMock.secondCall, 'editServerModal', true);

        sinon.assert.notCalled(ctx.serverModalController.createServerAndReset);
        sinon.assert.calledOnce(ctx.serverModalController.updateInstanceAndReset);

        sinon.assert.calledOnce(ctx.serverModalController.changeTab);
        sinon.assert.calledWith(ctx.serverModalController.changeTab, 'logs');

        sinon.assert.calledWith(ctx.loadingMock.thirdCall, 'editServerModalisBuilding', false);
        sinon.assert.calledWith(ctx.loadingMock.lastCall, 'editServerModal', false);
        $scope.$digest();
      });
    });
  });
});