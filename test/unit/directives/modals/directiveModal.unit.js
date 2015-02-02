'use strict';

// injector-provided
var $rootScope,
  $scope,
  $compile,
  $timeout,
  $document,
  jQuery,
  $templateCache;
var $elScope;
var thisUser;
var getNewForkNameStub;

var apiMocks = require('../../apiMocks/index');

function makeDefaultScope () {
  return {
    data: {
      instance: {
        attrs: apiMocks.instances.building,
        state: {},
        fetch: sinon.spy()
      },
      instances: [
        {
          attrs: apiMocks.instances.building,
          state: {},
          fetch: sinon.spy()
        }, {
          attrs: apiMocks.instances.running,
          state: {},
          fetch: sinon.spy()
        }
      ]
    },
    actions: {
      rebuild: function () {}
    },
    currentModel: apiMocks.instances.building,
    stateModel: {}
  };
}

/**
 * Things to test
 *
 * Generic modal creation
 * Non generic modal creation
 * Actions are placed on the scope
 * Test each action
 *
 */

describe('directiveModal'.bold.underline.blue, function () {
  var ctx;
  function injectSetupCompile(scope, template) {
    angular.mock.module('app');
    getNewForkNameStub = sinon.spy();
    angular.mock.module('app', function ($provide) {
      $provide.value('getNewForkName', getNewForkNameStub);
    });

    angular.mock.inject(function (
      _$templateCache_,
      _$compile_,
      _$timeout_,
      _$document_,
      //_keypather_,
      _$rootScope_,
      _jQuery_
    ) {
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
      jQuery = _jQuery_;
      $document = _$document_;
      $templateCache = _$templateCache_;
    });
    if (scope) {
      Object.keys(scope).forEach(function (key) {
        $scope[key] = scope[key];
      });
    }
    $scope.user = thisUser;

    ctx = {};
    ctx.template = directiveTemplate.attribute('modal', {
      'modal-data': 'data',
      'modal-actions': 'actions',
      'modal-template': template || 'viewModalError',
      'modal-current-model': 'currentModel',
      'modal-state-model': 'stateModel'
    });

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  describe('Check that the directive added what it needs to the scope', function () {
    it('should have everything on the scope that was given', function () {
      var inputScope = makeDefaultScope();
      injectSetupCompile(inputScope);
      expect($elScope.data).to.deep.equal($scope.data);
      // Actions was modified, so just verify it exists
      expect($elScope.actions).to.be.ok;
      expect($elScope.actions.rebuild).to.be.a('function');
      expect($elScope.template).to.be.ok;
      expect($elScope.currentModel).to.deep.equal($scope.currentModel);
      expect($elScope.stateModel).to.deep.equal($scope.stateModel);

      // Check that the actions were added
      expect($elScope.defaultActions).to.be.ok;
      expect($elScope.defaultActions.save).to.be.a('function');
      expect($elScope.defaultActions.cancel).to.be.a('function');
      expect($elScope.defaultActions.close).to.be.a('function');

      var event = document.createEvent('MouseEvent');
      event.initMouseEvent('click', true, true);
      ctx.element[0].dispatchEvent(event);
      $scope.$digest();

      $scope.$destroy();
    });
  });

  describe('Opening a Modal', function () {
    it('should add the viewOpen* to the body for a non-generic Modal', function () {
      var modalTemplate = 'viewOpenModalFork';
      injectSetupCompile(makeDefaultScope(), modalTemplate);

      var event = document.createEvent('MouseEvent');
      event.initMouseEvent('click', true, true);
      ctx.element[0].dispatchEvent(event);

      $scope.$digest();
      expect($elScope.in).to.be.ok;
      var jBody = jQuery('body');
      var view = jBody.find('modal-fork-box');
      expect(view).to.be.ok;

      $scope.$destroy();
      expect($document[0].querySelector('.modal-fork')).to.not.be.ok;
    });

    it('should add the genericOpen to the body for a generic Modal', function () {
      var modalTemplate = 'viewModalDeleteBox';
      injectSetupCompile(makeDefaultScope(), modalTemplate);

      var event = document.createEvent('MouseEvent');
      event.initMouseEvent('click', true, true);
      ctx.element[0].dispatchEvent(event);

      $scope.$digest();
      expect($elScope.in).to.be.ok;
      var jBody = jQuery('body');
      var openView = jBody.find('modal-generic');
      var modalView = jBody.find('Delete Box');
      expect(openView).to.be.ok;
      expect(modalView).to.be.ok;

      $scope.$destroy();
      expect($document[0].querySelector('modal-generic')).to.not.be.ok;
    });

    it('should destroy the scope and remove the view from the body', function () {
      var modalTemplate = 'viewOpenModalFork';
      injectSetupCompile(makeDefaultScope(), modalTemplate);

      var event = document.createEvent('MouseEvent');
      event.initMouseEvent('click', true, true);
      ctx.element[0].dispatchEvent(event);

      $scope.$digest();
      expect($elScope.in).to.be.ok;
      var jBody = jQuery('body');
      var openView = jBody.find('modal-fork-box');
      expect(openView).to.be.ok;

      $scope.$destroy();
      expect($elScope.in).to.be.false;
      // The mouse click should no longer work
      expect(ctx.element[0].onclick).to.be.null;
      expect($document[0].querySelector('.modal-fork')).to.not.be.ok;
    });
  });

  describe('Testing the functions', function () {
    describe('Without local versions', function () {
      beforeEach(function () {
        injectSetupCompile(makeDefaultScope());
        var event = document.createEvent('MouseEvent');
        event.initMouseEvent('click', true, true);
        ctx.element[0].dispatchEvent(event);
        $scope.$digest();
      });
      it('Save should save data to the stateModel', function (done) {
        expect($elScope.defaultActions.save).to.be.a('function');
        expect($elScope.defaultActions.cancel).to.be.a('function');
        expect($elScope.defaultActions.close).to.be.a('function');
        $elScope.defaultActions.save({env: 'hey', cheese: 'now'}, ['env'], function() {
          expect($scope.stateModel).to.deep.equal({env: 'hey'});
          $scope.$destroy();
          done();
        });
      });

      it('cancel should call close', function () {
        var closeSpy = sinon.spy();
        $elScope.defaultActions.close = closeSpy;
        $elScope.defaultActions.cancel();
        expect(closeSpy.called).to.be.ok;
      });

      it('close should set scope.in to false', function () {
        $elScope.in = true;
        $elScope.defaultActions.close();
        expect($elScope.in).to.be.false;
      });
    });
    describe('With local versions', function () {
      var cancelSpy, saveSpy;
      beforeEach(function () {
        var scope = makeDefaultScope();
        saveSpy = sinon.spy();
        scope.actions.save = saveSpy;
        cancelSpy = sinon.spy();
        scope.actions.cancel = cancelSpy;
        injectSetupCompile(scope);

        var event = document.createEvent('MouseEvent');
        event.initMouseEvent('click', true, true);
        ctx.element[0].dispatchEvent(event);
      });
      it('Save should save data to the stateModel, then call the actions save()', function (done) {
        $elScope.defaultActions.save({env: 'hey', cheese: 'now'}, ['env'], function() {
          expect($scope.stateModel).to.deep.equal({env: 'hey'});
          expect(saveSpy.called).to.be.ok;
          $scope.$destroy();
          done();
        });
      });

      it('cancel should call local cancel, then close', function (done) {
        $elScope.defaultActions.close = function () {
          $scope.$destroy();
          done();
        };
        $elScope.defaultActions.cancel();
      });
    });

  });
});
