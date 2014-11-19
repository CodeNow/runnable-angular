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

  it('properly splits up dependencies', function () {
    // console.log($elScope.envPopover.actions);
    var result = $elScope.envToObjects(['a=b', 'c=d', 'e=f']);
    expect(result).to.be.an.Array;
    expect(result).to.deep.equal([
      {key: 'a', value: 'b'},
      {key: 'c', value: 'd'},
      {key: 'e', value: 'f'}
    ]);
  });

  it('properly sews dependencies back together', function() {
    var result = $elScope.envPopover.actions.saveDeps([
      {key: 'a', value: 'b'},
      {key: 'c', value: 'd'},
      {key: 'e', value: 'f'}
    ]);

    expect(result).to.be.an.Array;
    expect(result).to.deep.equal(['a=b', 'c=d', 'e=f']);
  });

  it('returns an empty array when provided with a falsy value', function() {
    var result = $elScope.envToObjects();
    expect(result).to.be.an.Array;
    expect(result).to.deep.equal([]);
    var result = $elScope.envPopover.actions.saveDeps();
    expect(result).to.be.an.Array;
    expect(result).to.deep.equal([]);
  });

  it('should throw an error if we forget the type attribute', function() {
    var template = directiveTemplate('linked-instances', {});

    function errCompile () {
      $compile(template);
    }

    expect(errCompile).to.throw('linkedInstances requires a type of modal or sidebar');
  });

});
