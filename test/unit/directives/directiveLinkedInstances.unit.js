'use strict';

// injector-provided
var $compile,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout;
var $elScope;

function fetch (cb) {
  cb();
}

function makeDeps () {
  return {
    models: [{
      attrs: {
        name: 'hello',
        owner: {
          username: 'runnable-doobie'
        },
        env: ['a=b']
      },
      state: {
        name: 'hello-copy'
      },
      fetch: fetch
    }, {
      attrs: {
        name: 'hello',
        owner: {
          username: 'runnable-doobie'
        }
      },
      fetch: fetch
    }, {
      attrs: {
        name: 'hello',
        owner: {
          username: 'runnable-doobie'
        }
      },
      fetch: fetch
    }]
  };
}

describe('directiveLinkedInstances'.bold.underline.blue, function() {
  var ctx;

  function injectSetupCompile (type) {
    angular.mock.module('app');
    angular.mock.inject(function (
      _$compile_,
      _$rootScope_,
      _$state_,
      _$stateParams_,
      _$timeout_
    ) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $state = _$state_;
      $stateParams = _$stateParams_;
      $scope = _$rootScope_.$new();
      $timeout = _$timeout_;
    });

    ctx = {};
    $scope.scp = makeDeps();
    $scope.instances = makeDeps().models;
    $scope.items = [];

    ctx.template = directiveTemplate('linked-instances', {
      'instance-dependencies': 'scp.deps',
      'instances': 'instances',
      'items': 'items',
      'type': type,
      'fork-dependencies': true
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  describe('modal', function() {
    beforeEach(function () {
      injectSetupCompile('modal');
    });
    it('should set up properly with instances', function() {
      expect($elScope.forkDependencies).to.be.true;
      $scope.scp.deps = makeDeps();
      $scope.scp.deps.models.forEach(function (instance) {
        $scope.items.push({
          instance: instance,
          opts: {
            name: instance.attrs.name + '-copy'
          }
        });
      });
      $scope.$digest();

      expect(ctx.element[0].querySelectorAll('div[ng-repeat]').length).to.equal(3);
      expect(ctx.element[0].querySelector('input.input').value).to.equal('hello-copy');
    });
  });

  describe('sidebar', function() {
    beforeEach(function() {
      injectSetupCompile('sidebar');
    });
    it('should initialize sidebar properly', function() {
      $scope.scp.deps = makeDeps();

      $scope.$digest();
      expect(ctx.element[0].querySelectorAll('a.box-item-cluster').length).to.equal(3);
    });
  });

  it('should throw an error if we forget the type attribute', function() {
    function errCompile () {
      injectSetupCompile('');
    }

    expect(errCompile).to.throw('linkedInstances requires a type of modal or sidebar');
  });



});
