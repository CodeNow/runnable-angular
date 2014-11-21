var $rootScope,
    $scope,
    $timeout,
    $state,
    $stateParams,
    ctx;

function makeFakeInstance (env, deps) {
  var instance = {
    copy: angular.noop,
    state: {},
    attrs: {}
  };
  sinon.stub(instance, 'copy', function (cb) {
    setTimeout(cb, 10);
    return {
      update: function(opts, cb) {
        expect(opts).to.be.an.Object;
        // Both root instance and dep new names end in -test
        expect(opts.name).to.match(/-test$/);
        if (env) {
          expect(opts.env).to.deep.equal(['a=b']);
        } else {
          expect(opts.env).to.be.undefined;
        }
        cb();
      }
    };
  });
  if (env) {
    instance.attrs.env = ['a=b'];
  }
  if (deps) {
    instance.dependencies = {
      models: [makeFakeInstance(env, false)]
    };
    instance.dependencies.models[0].state.name = 'dep-test';
  }
  return instance;
}

describe('serviceHelperInstanceActionsModal'.bold.underline.blue, function() {
  function initState () {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('$stateParams', {
        userName: 'username',
        instanceName: 'instancename'
      });
    });
    angular.mock.inject(function (
        _$rootScope_,
        _$timeout_,
        _$state_,
        _$stateParams_,
        _helperInstanceActionsModal_
    ) {
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $timeout = _$timeout_;
      $state = _$state_;
      $stateParams = _$stateParams_;

      $rootScope.dataApp = {
        data: {
          loading: false
        }
      };

      $scope.popoverGearMenu = {
        actions: {},
        data: {}
      };

      ctx = {};
      ctx.service = _helperInstanceActionsModal_;
      ctx.service($scope);
    });
  }

  describe('actionsModalFork'.blue, function() {
    var dmf;
    beforeEach(initState);
    beforeEach(function() {
      dmf = {
        data: $scope.popoverGearMenu.data.dataModalFork,
        actions: $scope.popoverGearMenu.actions.actionsModalFork
      };
    });

    describe('forkInstance'.blue, function() {
      it('should function properly with a single instance with no env', function(done) {
        $scope.instance = makeFakeInstance(false, false);

        var fakeGo = sinon.stub($state, 'go');
        dmf.actions.forkInstance('test-test', false, function (err) {
          if (err) { return done(err); }
          // scope changes
          expect($scope.popoverGearMenu.data.show).to.be.false;
          expect($rootScope.dataApp.data.loading).to.be.true;
          expect($scope.instance.state.name).to.equal('test-test');

          sinon.assert.called(fakeGo);
          sinon.assert.called($scope.instance.copy);
          sinon.assert.calledWith(fakeGo,'instance.instance', {
            userName: 'username',
            instanceName: 'test-test'
          });
          done();
        });
      });

      it('should function properly with a single instance with env', function(done) {
        $scope.instance = makeFakeInstance(true, false);

        var fakeGo = sinon.stub($state, 'go');
        dmf.actions.forkInstance('test-test', false, function (err) {
          if (err) { return done(err); }
          // scope changes
          expect($scope.popoverGearMenu.data.show).to.be.false;
          expect($rootScope.dataApp.data.loading).to.be.true;
          expect($scope.instance.state.name).to.equal('test-test');

          sinon.assert.called(fakeGo);
          sinon.assert.called($scope.instance.copy);
          sinon.assert.calledWith(fakeGo,'instance.instance', {
            userName: 'username',
            instanceName: 'test-test'
          });
          done();
        });
      });

      it('should work with dependent instances', function(done) {
        $scope.instance = makeFakeInstance(true, true);
        var stubUpdate = sinon.stub($scope.instance.dependencies.models)

        var fakeGo = sinon.stub($state, 'go');
        dmf.actions.forkInstance('test-test', true, function (err) {
          if (err) { return done(err); }
          // scope changes
          expect($scope.popoverGearMenu.data.show).to.be.false;
          expect($rootScope.dataApp.data.loading).to.be.true;
          expect($scope.instance.state.name).to.equal('test-test');

          var dep = $scope.instance.dependencies.models[0];
          sinon.assert.called(dep.copy);

          sinon.assert.called(fakeGo);
          sinon.assert.called($scope.instance.copy);
          sinon.assert.calledWith(fakeGo,'instance.instance', {
            userName: 'username',
            instanceName: 'test-test'
          });
          done();
        });
      });

      it('should not fork dependent instances when not requested', function(done) {
        $scope.instance = makeFakeInstance(true, true);

        var fakeGo = sinon.stub($state, 'go');
        dmf.actions.forkInstance('test-test', false, function (err) {
          if (err) { return done(err); }
          // scope changes
          expect($scope.popoverGearMenu.data.show).to.be.false;
          expect($rootScope.dataApp.data.loading).to.be.true;
          expect($scope.instance.state.name).to.equal('test-test');

          var dep = $scope.instance.dependencies.models[0];
          sinon.assert.notCalled(dep.copy);

          sinon.assert.called(fakeGo);
          sinon.assert.called($scope.instance.copy);
          sinon.assert.calledWith(fakeGo,'instance.instance', {
            userName: 'username',
            instanceName: 'test-test'
          });
          done();
        });
      });
    });

    describe('cancel'.blue, function() {
      it('should properly set variables', function() {
        dmf.data.newName = 'test';
        dmf.actions.cancel();
        expect(dmf.data.newForkName).to.equal('test-copy');
        expect($scope.popoverGearMenu.data.show).to.be.false;
      });
    });
  });

  describe('errors'.blue, function() {
    it('should throw with missing $scope data', function() {
      expect(ctx.service).to.throw('helperInstanceActionsModal $scope popoverGearMenu not defined');
      expect(ctx.service.bind({}, {})).to.throw('helperInstanceActionsModal $scope popoverGearMenu not defined');
      expect(ctx.service.bind({}, {
        popoverGearMenu: {}
      })).to.throw('helperInstanceActionsModal $scope popoverGearMenu not defined');
    });
  });
});