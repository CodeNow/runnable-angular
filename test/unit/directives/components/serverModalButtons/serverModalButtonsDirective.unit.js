'use strict';

var $rootScope,
  $scope;
var element;
var $compile;
var $q;
var $elScope;
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
      isDirty: sinon.stub(),
      needsToBeDirtySaved: sinon.stub().returns(false)
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
      $scope.serverModalController.isTabVisible = sinon.stub();
      element = $compile(template)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
      $elScope.isPrimaryButtonDisabled = sinon.stub().returns(false);
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

  var allButtons = [
    'cancel',
    'done',
    'save',
    'next',
    'demoSave',
    'willRebuildOnSave',
    'disableSave'
  ];
  function testButtons (enabledButtons) {
    allButtons.forEach(function (button) {
      if (enabledButtons.includes(button)) {
        it('should enable ' + button + ' button', function () {
          expect($elScope.getDisplayFlag(button)).to.equal(true);
        });
      } else {
        it('should disable ' + button + ' button', function () {
          expect($elScope.getDisplayFlag(button)).to.equal(false);
        });
      }
    });
  }
  describe('getDisplayFlag', function () {
    describe('when in demo mode', function () {
      beforeEach(function () {
        $rootScope.featureFlags.demoFlowPhase2 = true;
        $elScope.SMC.isDemo = true;
        $elScope.$digest();
      });
      testButtons(['cancel', 'demoSave']);
    });

    describe('when editing an instance', function () {
      beforeEach(function () {
        $elScope.SMC.instance = {};
        $elScope.SMC.isDemo = false;
        $elScope.SMC.isDirty.returns(false);
        $elScope.SMC.needsToBeDirtySaved.returns(false);
        $elScope.$digest();
      });
      testButtons(['cancel', 'save', 'done']);

      it('should enable willRebuildOnSave if is dirty', function () {
        $elScope.SMC.isDirty.returns('build');
        $elScope.$digest();
        expect($elScope.getDisplayFlag('willRebuildOnSave')).to.equal(true);
      });

      it('should enable the disableSave flag if needsToBeDirtySaved is set and its not dirty', function () {
        $elScope.SMC.needsToBeDirtySaved.returns(true);
        $elScope.SMC.isDirty.returns(false);
        $elScope.$digest();
        expect($elScope.getDisplayFlag('disableSave')).to.equal(true);
      });

      it('should disable the disableSave flag if needsToBeDirtySaved is set and its dirty', function () {
        $elScope.SMC.needsToBeDirtySaved.returns(true);
        $elScope.SMC.isDirty.returns(true);
        $elScope.$digest();
        expect($elScope.getDisplayFlag('disableSave')).to.equal(false);
      });

      it('should enable the disableSave flag if isPrimaryButtonDisabled is set', function () {
        $elScope.isPrimaryButtonDisabled.returns(true);
        $elScope.$digest();
        expect($elScope.getDisplayFlag('disableSave')).to.equal(true);
      });
    });

    describe('when setting up a new instance and not showing build files', function () {
      beforeEach(function () {
        $elScope.SMC.isSettingUpNewInstance = true;
        $elScope.SMC.isTabVisible.returns(false);
        $elScope.$digest();
      });
      testButtons(['cancel', 'next']);
    });

    describe('when setting up a new instance and showing build files', function () {
      beforeEach(function () {
        $elScope.SMC.isSettingUpNewInstance = true;
        $elScope.SMC.isTabVisible.returns(true);
        $elScope.$digest();
      });

      testButtons(['cancel', 'save', 'willRebuildOnSave']);

      it('should enable the disableSave flag if needsToBeDirtySaved is set and its not dirty', function () {
        $elScope.SMC.needsToBeDirtySaved.returns(true);
        $elScope.SMC.isDirty.returns(false);
        $elScope.$digest();
        expect($elScope.getDisplayFlag('disableSave')).to.equal(true);
      });

      it('should disable the disableSave flag if needsToBeDirtySaved is set and its dirty', function () {
        $elScope.SMC.needsToBeDirtySaved.returns(true);
        $elScope.SMC.isDirty.returns(true);
        $elScope.$digest();
        expect($elScope.getDisplayFlag('disableSave')).to.equal(false);
      });

      it('should enable the disableSave flag if isPrimaryButtonDisabled is set', function () {
        $elScope.isPrimaryButtonDisabled.returns(true);
        $elScope.$digest();
        expect($elScope.getDisplayFlag('disableSave')).to.equal(true);
      });
    });
  });
});
