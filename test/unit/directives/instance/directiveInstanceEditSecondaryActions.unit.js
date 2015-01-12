'use strict';

// injector-provided
var $rootScope,
    $scope,
    async,
    $state,
    $compile,
    $timeout,
    $stateParams;
var $elScope;
var thisUser;
var $httpBackend;

var apiMocks = require('../../apiMocks/index');
var MockQueryAssist = require('../../fixtures/mockQueryAssist');

function makeDefaultScope () {
  return {
    instance: {
      attrs: angular.copy(apiMocks.instances.building)
    },
    instances: [apiMocks.instances.building, apiMocks.instances.running],
    saving: false
  };
}


describe('directiveInstanceEditSecondaryActions'.bold.underline.blue, function() {
  var ctx;
  function injectSetupCompile(scope) {
    angular.mock.module('app');
    var stateMock = {
      '$current': {
        name: 'instance.instanceEdit'
      },
      go: function () {}
    };
    angular.mock.module(function ($provide) {
      $provide.value('$state', stateMock);
      $provide.value('helperInstanceActionsModal', function () {
        ctx.helperCalled = true;
      });
      $provide.value('QueryAssist', MockQueryAssist);
      $provide.value('$stateParams', {
        userName: 'username',
        buildId: '54668070531ae50e002c8503',
        instanceName: 'instancename'
      });
    });
    angular.mock.inject(function (
      //_async_,
      //_QueryAssist_,
      _$state_,
      _$stateParams_,
      _$compile_,
      _$timeout_,
      _$rootScope_
    ) {
      $state = _$state_;
      $stateParams = _$stateParams_;
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
      $timeout = _$timeout_;
    });
    if (scope) {
      Object.keys(scope).forEach(function (key) {
        $scope[key] = scope[key];
      });
    }
    $scope.user = thisUser;

    ctx = {};
    ctx.stateMock = stateMock;
    ctx.template = directiveTemplate('instance-edit-secondary-actions', {
      instance: 'instance',
      instances: 'instances',
      saving: 'saving'
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();

  }
  describe('Check that the directive added what it needs to the scope', function() {
    var inputScope;
    beforeEach(function () {
      inputScope = makeDefaultScope();
      injectSetupCompile(inputScope);
    });
    it('should have everything on the scope that was given', function() {
      expect($elScope.instance).to.equal(inputScope.instance);
      expect($elScope.instances).to.equal(inputScope.instances);
      expect($elScope.saving).to.equal(inputScope.saving);
      expect($elScope.popoverGearMenu).to.be.ok;
      expect($elScope.popoverGearMenu.data).to.deep.equal({ show: false });
      expect($elScope.popoverGearMenu.actions).to.deep.equal({
        actionsModalFork: {},
        actionsModalEnvironment:{},
        actionsModalRename:{},
        actionsModalDelete:{}
      });
    });
    it('should modify the scope', function (done) {
      ctx.stateMock.go = function (state) {
        expect(state).to.equal('instance.instance');
        done();
      };
      $scope.$digest();
      expect($elScope.popoverGearMenu.data.show).to.be.false;
      expect(ctx.helperCalled).to.be.ok;
      expect($elScope.goToInstance).to.be.ok;
      $elScope.goToInstance();

    });
  });
});
