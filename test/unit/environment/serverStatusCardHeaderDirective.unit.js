'use strict';
describe('serverStatusCardHeaderDirective'.bold.underline.blue, function () {
  var ctx;
  var $timeout;
  var $scope;
  var $compile;
  var $elScope;
  var $rootScope;
  var keypather;
  var parseDockMock = new (require('../fixtures/mockFetch'))();
  var fetchStackAnalysisMock;
  var mockState;

  var apiMocks = require('../apiMocks/index');
  function setup(scope) {

    fetchStackAnalysisMock = sinon.stub();

    ctx = {};
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      }
    };
    mockState = {
      params: {
        userName: 'SomeKittens'
      }
    };

    runnable.reset(apiMocks.user);
    angular.mock.module('app', function ($provide) {
      $provide.factory('ModalService', function ($q) {
        ctx.showModalStub = sinon.stub().returns($q.when({
          close: $q.when(true)
        }));
        return {
          showModal: ctx.showModalStub
        };
      });
    });
    angular.mock.inject(function (
      _$compile_,
      _$timeout_,
      _$rootScope_,
      _keypather_
    ) {
      $timeout = _$timeout_;
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
    });

    $rootScope.featureFlags = {};

    Object.keys(scope).forEach(function (key) {
      $scope[key] = scope[key];
    });

    ctx.template = directiveTemplate('server-status-card-header', {
      'instance': 'instance'
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
    $scope.$digest();
  }
  describe('actions', function () {
    it('should delete a server', function () {
      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );
      setup({
        instance: instance
      });
      $rootScope.$digest();
      instance.destroy = sinon.spy(function (cb) {
        cb();
      });
      var closePopoverSpy = sinon.spy();
      $rootScope.$on('close-popovers', closePopoverSpy);
      $elScope.popoverServerActions.deleteServer(instance);
      $rootScope.$digest();
      sinon.assert.calledOnce(closePopoverSpy);
      sinon.assert.calledOnce(ctx.showModalStub);
      sinon.assert.calledOnce(instance.destroy);
      sinon.assert.calledWith(ctx.showModalStub, {
        controller: 'ConfirmationModalController',
        controllerAs: 'CMC',
        templateUrl: 'confirmDeleteServerView'
      });
    });
    it('should open then edit server modal', function () {
      var instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );
      setup({
        instance: instance
      });
      $rootScope.$digest();
      instance.destroy = sinon.spy(function (cb) {
        cb();
      });
      var closePopoverSpy = sinon.spy();
      $rootScope.$on('close-popovers', closePopoverSpy);
      $elScope.popoverServerActions.openEditServerModal('hello');
      $rootScope.$digest();
      sinon.assert.calledOnce(closePopoverSpy);
      sinon.assert.calledOnce(ctx.showModalStub);
      sinon.assert.calledWith(ctx.showModalStub, {
        controller: 'EditServerModalController',
        controllerAs: 'SMC',
        templateUrl: 'editServerModalView',
        inputs: {
          tab: 'hello',
          instance: instance
        }
      });
    });
  });
});
