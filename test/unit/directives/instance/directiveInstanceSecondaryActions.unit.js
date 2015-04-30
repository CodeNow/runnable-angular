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

var apiMocks = require('../../apiMocks/index');
var MockQueryAssist = require('../../fixtures/mockQueryAssist');

function makeDefaultScope () {
  return {
    instance: {
      attrs: angular.copy(apiMocks.instances.running),
      build: angular.copy(apiMocks.instances.running.build)
    },
    instances: [apiMocks.instances.building, apiMocks.instances.running],
    saving: false
  };
}


describe('directiveInstanceSecondaryActions'.bold.underline.blue, function() {
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
      $provide.value('QueryAssist', MockQueryAssist);
      $provide.value('$stateParams', {
        userName: 'username',
        buildId: '54668070531ae50e002c8503',
        instanceName: 'instancename'
      });
      $provide.value('fetchCoachMarkData', sinon.spy(function (type, cb) {
        cb(null);
      }));
    });
    angular.mock.inject(function (
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
    ctx.template = directiveTemplate.attribute('instance-secondary-actions', {
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
      expect($elScope.saving).to.equal(false);
    });
    it('should modify the scope', function () {
      $scope.$digest();
      expect($elScope.goToEdit).to.be.ok;
    });
  });

  describe('Check functions', function () {
    beforeEach(function () {
      injectSetupCompile(makeDefaultScope());
    });
    it('should allow the user to switch to instanceEdit', function (done) {
      ctx.stateMock.go = function (state, params) {
        expect(state).to.equal('instance.instanceEdit');
        expect(params.userName).to.equal('username');
        expect(params.instanceName).to.equal('instancename');
        expect(params.buildId).to.equal(apiMocks.builds.setup._id);
        done();
      };
      $scope.instance.build.deepCopy = function (cb) {
        $timeout(cb);
        return {
          attrs: angular.copy(apiMocks.builds.setup),
          id: function () {
            return this.attrs._id;
          }
        };
      };
      $scope.$digest();
      $elScope.goToEdit();
      $scope.$digest();
      $timeout.flush();
    });
    it('should allow the user to stop the instance', function () {
      $scope.instance.stop = sinon.spy(function (opts, cb) {
        expect(opts).to.be.undefined;
        cb();
      });
      $scope.instance.fetch = function (cb) {
        cb();
      };
      $scope.$digest();
      $elScope.actions.stopInstance();
      expect($elScope.saving).to.be.true;
      expect($elScope.starting).to.be.false;
      $scope.$digest();
      sinon.assert.calledOnce($scope.instance.stop);
      expect($elScope.saving).to.be.false;
    });

    it('should allow the user to start the instance', function () {
      $scope.instance.start = sinon.spy(function (opts, cb) {
        expect(opts).to.be.undefined;
        cb();
      });
      $scope.instance.fetch = function (cb) {
        cb();
      };
      $scope.$digest();
      $elScope.actions.startInstance();
      expect($elScope.saving).to.be.true;
      expect($elScope.starting).to.be.true;
      $scope.$digest();
      sinon.assert.calledOnce($scope.instance.start);
      expect($elScope.saving).to.be.false;
    });
  });
});
