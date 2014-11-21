// injector-provided
var $compile,
    $rootScope,
    $scope,
    $timeout;
var $elScope;

describe('directiveEnvironmentButton'.bold.underline.blue, function() {
  var ctx;

  function injectSetupCompile () {
    angular.mock.module('app');
    angular.mock.inject(function (
      _$compile_,
      _$rootScope_,
      _$timeout_
    ) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      $timeout = _$timeout_;

      $rootScope.safeApply = function(cb) {
        $timeout(function() {
          $scope.$digest();
        });
      };
    });

    ctx = {};
    $scope.instance = {
      attrs: {
        env: ['a=b', 'c=d', 'e=f']
      }
    };
    ctx.template = directiveTemplate('environment-button', {
      instance: 'instance'
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  beforeEach(injectSetupCompile);

  it('should set up properly with an instance', function() {
    // three buttons includes two in the popover
    expect(ctx.element.find('button').length).to.equal(3);
  });

  it('properly splits up dependencies', function () {
    var result = $elScope.envToObjects(['a=b', 'c=d', 'e=f']);
    expect(result).to.be.an.Array;
    expect(result).to.deep.equal([
      {key: 'a', value: 'b'},
      {key: 'c', value: 'd'},
      {key: 'e', value: 'f'}
    ]);
  });

  it('properly sews dependencies back together', function() {
    var result = $elScope.envToStrings([
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
    var result = $elScope.envToStrings();
    expect(result).to.be.an.Array;
    expect(result).to.deep.equal([]);
  });

  describe('popover actions'.blue, function() {
    it('should save popover values', function() {
      var fakeInstance = {
        extend: sinon.spy(),
        state: {}
      };
      var fakeEvent = {
        preventDefault: sinon.spy()
      };
      var fakeEnvToStrings = sinon.stub($elScope, 'envToStrings').returns(['a=b', 'c=d', 'e=f']);

      $elScope.envPopover.actions.saveEnv(fakeInstance, fakeEvent);

      sinon.assert.called(fakeEvent.preventDefault);
      sinon.assert.called(fakeEnvToStrings);
      sinon.assert.called(fakeInstance.extend);
      sinon.assert.calledWith(fakeInstance.extend, {
        env: ['a=b', 'c=d', 'e=f']
      });
      expect(fakeInstance.state.envShow).to.be.false;
    });

    it('should reset popover values on cancel', function() {
      var fakeInstance = {
        state: {},
        attrs: {}
      };
      var fakeEvent = {
        preventDefault: sinon.spy()
      };
      var fakeEnvToObjects = sinon.stub($elScope, 'envToObjects').returns([
        {key: 'a', value: 'b'},
        {key: 'c', value: 'd'},
        {key: 'e', value: 'f'}
      ]);

      $elScope.envPopover.actions.cancelEnv(fakeInstance, fakeEvent);

      sinon.assert.called(fakeEvent.preventDefault);
      sinon.assert.called(fakeEnvToObjects);
      expect(fakeInstance.state.envVars).to.deep.equal([
        {key: 'a', value: 'b'},
        {key: 'c', value: 'd'},
        {key: 'e', value: 'f'}
      ]);
      expect(fakeInstance.state.envShow).to.be.false;
    });
  });

});
