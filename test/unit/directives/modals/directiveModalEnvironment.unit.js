'use strict';

// injector-provided
var $rootScope,
  $scope,
  $compile,
  $timeout,
  $document,
  $localStorage,
  $templateCache;
var $elScope;
var thisUser;

var apiMocks = require('../../apiMocks/index');

function makeDefaultScope () {
  return {
    data: {
      instance: apiMocks.instances.building,
      instances: [apiMocks.instances.building, apiMocks.instances.running]
    },
    actions: {
      rebuild: function () {}
    },
    defaultActions: {
      save: function () {}
    },
    currentModel: apiMocks.instances.building,
    stateModel: {}
  };
}

describe('directiveModalEnvironment'.bold.underline.blue, function () {
  var ctx;
  function injectSetupCompile(scope, localStorageGuides) {
    angular.mock.module('app', function ($provide) {
      $provide.value('$localStorage', {
        guides: localStorageGuides
      });
    });
    angular.mock.inject(function (
      _$templateCache_,
      _$localStorage_,
      _$compile_,
      _$timeout_,
      _$document_,
      //_keypather_,
      _$rootScope_
    ) {
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
      $localStorage = _$localStorage_;
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
    ctx.template = directiveTemplate.attribute('modal-environment', {
      'data': 'data',
      'actions': 'actions',
      'default-actions': 'defaultActions',
      'current-model': 'currentModel',
      'state-model': 'stateModel'
    });

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  describe('Check that the directive added what it needs to the scope', function () {
    beforeEach(function () {
      injectSetupCompile(makeDefaultScope());
    });
    it('should have everything on the scope that was given', function () {
      expect($elScope.data).to.be.ok;
      // Actions was modified, so just verify it exists
      expect($elScope.actions).to.be.ok;
      expect($elScope.actions.rebuild).to.be.a('function');
      expect($elScope.currentModel).to.deep.equal($scope.currentModel);
      expect($elScope.stateModel).to.deep.equal($scope.stateModel);
      expect($elScope.defaultActions).to.be.ok;
      expect($elScope.defaultActions.save).to.be.a('function');


      expect($elScope.data.hideGuideHelpEnvModal).to.be.false;
      expect($elScope.pasteLinkedInstance).to.be.a('function');

      expect($elScope.validation).to.deep.equal({});
      expect($elScope.tempModel).to.deep.equal({});

      $scope.$destroy();
      $scope.$digest();
    });
  });
  describe('LocalStorage should work', function () {
    it('should set the flag in local storage to true', function () {
      injectSetupCompile(makeDefaultScope(), {guides: {
        hideGuideHelpEnvModal: false
      }});
      expect($elScope.data.hideGuideHelpEnvModal).to.be.false;
      $elScope.onChangeHideGuideEnv();
      expect($elScope.data.hideGuideHelpEnvModal).to.be.true;
      expect($localStorage.guides.hideGuideHelpEnvModal).to.be.true;

      $scope.$destroy();
      $scope.$digest();
    });
    it('should set hideGuide to true in the beginning', function () {
      injectSetupCompile(makeDefaultScope(), {
        hideGuideHelpEnvModal: true
      });
      expect($elScope.data.hideGuideHelpEnvModal).to.be.true;
      $elScope.onChangeHideGuideEnv();
      expect($elScope.data.hideGuideHelpEnvModal).to.be.true;

      $scope.$destroy();
      $scope.$digest();
    });
  });

  describe('Events', function () {
    it('should broadcast when something is pasted to the modal', function (done) {
      var inputScope = makeDefaultScope();
      injectSetupCompile(inputScope);
      var text = 'Hello everybody';
      $elScope.$on('eventPasteLinkedInstance', function (event, pastedText) {
        expect(pastedText).to.equal(text);
        $scope.$destroy();
        $scope.$digest();
        done();
      });
      $elScope.pasteLinkedInstance(text);
    });
  });
});
