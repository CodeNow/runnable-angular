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

  function injectSetupCompile () {
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

      $rootScope.safeApply = function(cb) {
        $timeout(function() {
          $scope.$digest();
        });
      };
    });

    ctx = {};
    $scope.scp = {};
    $scope.instances = {};
    ctx.template = directiveTemplate('linked-instances', {
      'instance-dependencies': 'scp.deps',
      'instances': 'instances',
      'type': 'modal'
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  beforeEach(injectSetupCompile);

  it('should set up properly with instances', function() {
    expect($elScope.linkedBoxesChecked).to.be.true;

    $scope.scp.deps = makeDeps();

    $scope.$digest();

    expect(ctx.element[0].querySelectorAll('div[ng-repeat]').length).to.equal(3);
    expect(ctx.element[0].querySelector('input.input').value).to.equal('hello-copy');
  });

  it('should throw an error if we forget the type attribute', function() {
    injectSetupCompile();
    var template = directiveTemplate('linked-instances', {});

    function errCompile () {
      $compile(template);
    }

    expect(errCompile).to.throw('linkedInstances requires a type of modal or sidebar');
  });

  it('should not fetch dependencies if ', function() {
    injectSetupCompile();
    var template = directiveTemplate('linked-instances', {
      'instance-dependencies': 'scp.deps',
      'instances': 'instances',
      'type': 'modal',
      'is-active': false
    });

    var element = $compile(template)($scope);
    $scope.$digest();
    $elScope = element.isolateScope();
    // If this is false, we exited at the right time
    expect($elScope.linkedBoxesChecked).to.equal(undefined);
  });

});
