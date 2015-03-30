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

  it('Should listen to the openModal event and open a modal', function () {
    injectSetupCompile();
    var modalOptions = makeDefaultOptions();
    $rootScope.$emit('openModal', modalOptions);

    var openedModal = $document.find('body')[0].querySelector('.modal-backdrop');
    expect(openedModal).to.exist;
  });
});