'use strict';

// injector-provided
var $rootScope,
  $scope,
  $compile,
  $document,
  $templateCache;
var $elScope;

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
    if (scope) {
      Object.keys(scope).forEach(function (key) {
        $scope[key] = scope[key];
      });
    }

    ctx = {};
    ctx.template = directiveTemplate.attribute('modal', {
      'modal-data': 'data',
      'modal-actions': 'actions',
      'modal-template': 'viewModalError',
      'modal-current-model': 'currentModel',
      'modal-state-model': 'stateModel'
    });

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  it("should trigger the openModal event on click", function () {
    var inputScope = makeDefaultScope();
    injectSetupCompile(inputScope);
    sinon.spy($elScope, '$emit');
    window.helpers.click(ctx.element[0]);
    expect($elScope.$emit.calledWith('open-modal'), 'Called with').to.equal(true);

    var lastCallOptions = $elScope.$emit.lastCall.args[1];
    expect(lastCallOptions.data, 'Called with options.data').to.equal(inputScope.data);
    expect(lastCallOptions.actions, 'Called with options.actions').to.equal(inputScope.actions);
    expect(lastCallOptions.template, 'Called with options.template').to.equal('viewModalError');
    expect(lastCallOptions.currentModel, 'Called with options.currentModel').to.equal(inputScope.currentModel);
    expect(lastCallOptions.stateModel, 'Called with options.stateModel').to.equal(inputScope.stateModel);

    $elScope.$emit.restore();
  });

  it("should trigger the openModal event on data.in", function () {
    var inputScope = makeDefaultScope();
    inputScope.template = 'viewModalError';
    injectSetupCompile(inputScope);
    sinon.spy($elScope, '$emit');

    $elScope.data.in = true;
    $elScope.$digest();

    expect($elScope.$emit.calledWith('open-modal'), 'Called with').to.equal(true);

    var lastCallOptions = $elScope.$emit.lastCall.args[1];
    expect(lastCallOptions.data, 'Called with options.data').to.equal(inputScope.data);
    expect(lastCallOptions.actions, 'Called with options.actions').to.equal(inputScope.actions);
    expect(lastCallOptions.template, 'Called with options.template').to.equal('viewModalError');
    expect(lastCallOptions.currentModel, 'Called with options.currentModel').to.equal(inputScope.currentModel);
    expect(lastCallOptions.stateModel, 'Called with options.stateModel').to.equal(inputScope.stateModel);

    $elScope.$emit.restore();
  });
});
