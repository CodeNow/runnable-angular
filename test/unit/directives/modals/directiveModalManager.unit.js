'use strict';

// injector-provided
var $rootScope,
  $scope,
  $compile,
  $document,
  $templateCache;
var $elScope;

var apiMocks = require('../../apiMocks/index');

function makeDefaultOptions () {
  return {
    data: {
    },
    actions: {
      save: sinon.spy(),
      cancel: sinon.spy()
    },
    currentModel: apiMocks.instances.building,
    stateModel: {},
    template: 'viewModalError'
  };
}

/**
 * Things to test
 *
 * Generic modal creation
 * Test each action
 *
 */

describe('directiveModalManager'.bold.underline.blue, function () {
  var ctx;
  function injectSetupCompile() {
    angular.mock.module('app');
    angular.mock.inject(function (
      _$templateCache_,
      _$compile_,
      _$timeout_,
      _$document_,
      _$rootScope_
    ) {
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
      $document = _$document_;
      $templateCache = _$templateCache_;
    });
    ctx = {};
    ctx.template = directiveTemplate.attribute('modal-manager');
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  afterEach(function () {
    $rootScope.$emit('closeModal');
  });

  describe('Modal close/open states', function () {
    it('Should listen to the openModal event and open a modal', function () {
      injectSetupCompile();
      var modalOptions = makeDefaultOptions();
      $rootScope.$emit('openModal', modalOptions);

      var openedModal = $document.find('body')[0].querySelector('.modal-backdrop');
      expect(openedModal).to.exist;
    });

    it('Should close the previous modal if one was already open and the open event is fired', function () {
      injectSetupCompile();
      var modalOptions = makeDefaultOptions();
      $rootScope.$emit('openModal', modalOptions);

      var openedModal = $document.find('body')[0].querySelector('.modal-backdrop');
      openedModal.test = '123';

      $rootScope.$emit('openModal', modalOptions);

      var newModal = $document.find('body')[0].querySelector('.modal-backdrop');
      expect(newModal.test).to.not.exist;

    });

    it('Should listen to the closeModal event and close the modal', function () {
      injectSetupCompile();
      var modalOptions = makeDefaultOptions();
      $rootScope.$emit('openModal', modalOptions);

      var openedModal = $document.find('body')[0].querySelector('.modal-backdrop');
      expect(openedModal).to.exist;

      $rootScope.$emit('closeModal');

      var closedModal = $document.find('body')[0].querySelector('.modal-backdrop');
      expect(closedModal).to.not.exist;
    });


    it('Should listen to the destroy scope and close the modal', function () {
      injectSetupCompile();
      var modalOptions = makeDefaultOptions();
      $rootScope.$emit('openModal', modalOptions);

      var openedModal = $document.find('body')[0].querySelector('.modal-backdrop');
      expect(openedModal).to.exist;

      $elScope.$destroy();

      var closedModal = $document.find('body')[0].querySelector('.modal-backdrop');
      expect(closedModal).to.not.exist;
    });

    it('should work with a non-generic template', function () {
      injectSetupCompile();
      var modalOptions = makeDefaultOptions();
      modalOptions.template = 'viewOpenModalGettingStarted';
      $rootScope.$emit('openModal', modalOptions);

      var openedModal = $document.find('body')[0].querySelector('.modal-backdrop');
      expect(openedModal).to.exist;
    })
  });

  describe('default actions', function () {
    it('close action should close the modal', function () {
      injectSetupCompile();
      var modalOptions = makeDefaultOptions();
      $rootScope.$emit('openModal', modalOptions);

      $elScope.currentModalScope.defaultActions.close();

      var closedModal = $document.find('body')[0].querySelector('.modal-backdrop');
      expect(closedModal).to.not.exist;
    });
    it('close action should close the modal with a callback', function () {
      injectSetupCompile();
      var modalOptions = makeDefaultOptions();
      $rootScope.$emit('openModal', modalOptions);

      var callbackSpy = sinon.spy();
      $elScope.currentModalScope.defaultActions.close(callbackSpy);

      var closedModal = $document.find('body')[0].querySelector('.modal-backdrop');
      expect(closedModal).to.not.exist;
      expect(callbackSpy.calledOnce).to.equal(true);
    });
    it('save action should trigger the save action and the callback', function () {
      injectSetupCompile();
      var modalOptions = makeDefaultOptions();
      modalOptions.stateModel = {
        foo: 'bar'
      };
      $rootScope.$emit('openModal', modalOptions);

      var myObj = {
        foo: 'baz'
      };
      var paths = ['foo'];
      var cbSpy = sinon.spy();
      $elScope.currentModalScope.defaultActions.save(myObj, paths, cbSpy);

      expect(modalOptions.actions.save.calledOnce).to.equal(true);
      expect(modalOptions.stateModel.foo).to.equal('baz');
      expect(cbSpy.calledOnce).to.equal(true);
    });
    it('save action should trigger the the callback', function () {
      injectSetupCompile();
      var modalOptions = makeDefaultOptions();
      modalOptions.actions = {};
      modalOptions.stateModel = {
        foo: 'bar'
      };
      $rootScope.$emit('openModal', modalOptions);

      var myObj = {
        foo: 'baz'
      };
      var paths = ['foo'];
      var cbSpy = sinon.spy();
      $elScope.currentModalScope.defaultActions.save(myObj, paths, cbSpy);

      expect(modalOptions.stateModel.foo).to.equal('baz');
      expect(cbSpy.calledOnce).to.equal(true);
    });

    it('cancel action should close the modal and trigger the cancel action', function () {
      injectSetupCompile();
      var modalOptions = makeDefaultOptions();
      $rootScope.$emit('openModal', modalOptions);

      $elScope.currentModalScope.defaultActions.cancel();

      var closedModal = $document.find('body')[0].querySelector('.modal-backdrop');
      expect(closedModal).to.not.exist;
      expect(modalOptions.actions.cancel.calledOnce).to.equal(true);
    });

    it('cancel action should close the modal', function () {
      injectSetupCompile();
      var modalOptions = makeDefaultOptions();
      modalOptions.actions = {};
      $rootScope.$emit('openModal', modalOptions);

      $elScope.currentModalScope.defaultActions.cancel();

      var closedModal = $document.find('body')[0].querySelector('.modal-backdrop');
      expect(closedModal).to.not.exist;
    });
  });

});