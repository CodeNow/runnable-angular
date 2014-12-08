// injector-provided
var $rootScope,
  $scope,
  $compile,
  $timeout,
  $document,
  updateEnvStub,
  getNewForkNameStub;
var $elScope;
var thisUser;

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
    defaultActions: {
      save: function () {}
    }
  };
}

describe('directiveModalFork'.bold.underline.blue, function () {
  var ctx;
  function injectSetupCompile(scope) {
    updateEnvStub = sinon.spy();
    getNewForkNameStub = sinon.spy(function(instance) {
      return instance.attrs.name + '-new';
    });
    angular.mock.module('app', function ($provide) {
      $provide.value('updateEnvName', updateEnvStub);
      $provide.value('getNewForkName', getNewForkNameStub);
      $provide.value('linkedInstances', sinon.spy());
    });

    angular.mock.inject(function (
      _$compile_,
      _keypather_,
      _$timeout_,
      _$rootScope_
    ) {
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
      $rootScope.safeApply = function (cb) {
        _$timeout_(function () {
          $scope.$digest();
        });
      };
    });
    if (scope) {
      Object.keys(scope).forEach(function (key) {
        $scope[key] = scope[key];
      });
    }
    $scope.user = thisUser;

    ctx = {};
    ctx.template = directiveTemplate('modal-fork-box', {
      'data': 'data',
      'actions': 'actions',
      'default-actions': 'defaultActions'
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
      expect($elScope.defaultActions).to.be.ok;
      expect($elScope.defaultActions.save).to.be.a('function');

      sinon.assert.called(getNewForkNameStub);
      expect($elScope.data.forkDependencies).to.be.ok;

      $scope.$destroy();
      $scope.$digest();
    });
  });

  describe('watchers', function () {
    // tfw no deps :<
    it('does not do much without dependencies', function () {
      injectSetupCompile(makeDefaultScope());
      $elScope.data = {
        newForkName: 'newForkName'
      };
      $scope.$digest();
      sinon.assert.calledOnce(updateEnvStub);

      $scope.$destroy();
      $scope.$digest();
    });
    describe('with dependencies', function () {
      beforeEach(function () {
        var scope = makeDefaultScope();
        scope.data.instance.dependencies = {
          models: [{
            attrs: {
              name: 'dep'
            },
            fetch: sinon.spy()
          }]
        };
        injectSetupCompile(scope);
      });
      it('watches for an instance name change', function () {
        $elScope.data.newForkName = 'newForkName';
        $scope.$digest();
        sinon.assert.called(updateEnvStub);

        $scope.$destroy();
        $scope.$digest();
      });
      it('watches for a dependency instance name change', function () {
        $elScope.data.instance.dependencies.models[0].state = {
          name: 'newDepForkName'
        };
        $scope.$digest();
        sinon.assert.called(updateEnvStub);

        $scope.$destroy();
        $scope.$digest();
      });
    });
  });
});
