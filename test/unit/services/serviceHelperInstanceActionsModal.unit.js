'use strict';

var $rootScope,
    $scope,
    $timeout,
    $state,
    $stateParams,
    ctx,
    updateEnvStub;

function makeFakeItems (env, deps) {
  var instance = makeFakeInstance(env, deps);

  var combinedList = [instance];
  if (deps) {
    combinedList = combinedList.concat(instance.dependencies.models);
  }
  var items = combinedList.map(function (instance) {
    var item = {
      instance: instance,
      opts: {
        name: instance.state.name
      }
    };
    delete instance.state.name;
    if (env) {
      item.opts.env = instance.attrs.env;
    }
    return item;
  });
  return items;
}

function makeFakeInstance (env, deps) {
  var instance = {
    copy: angular.noop,
    state: {},
    attrs: {}
  };
  sinon.stub(instance, 'copy', function (opts, cb) {
    expect(opts).to.be.an.Object;
    // Both root instance and dep new names end in -test
    expect(opts.name).to.match(/-test$/);
    if (env) {
      expect(opts.env).to.deep.equal(['a=b']);
    } else {
      expect(opts.env).to.be.undefined;
    }
    cb();
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
    updateEnvStub = sinon.spy();
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('$stateParams', {
        userName: 'username',
        instanceName: 'instancename'
      });

      $provide.value('updateEnvName', updateEnvStub);
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

  describe('actionsModalRename', function() {
    var mr;
    beforeEach(initState);
    beforeEach(function() {
      mr = {
        data: $scope.popoverGearMenu.data.dataModalRename,
        actions: $scope.popoverGearMenu.actions.actionsModalRename
      };
    });
    describe('renameInstance'.blue, function() {
      var instance;
      beforeEach(function() {
        $scope.instance = {
          attrs: {
            name: 'properly'
          },
          update: sinon.spy(function(opts, cb) {
            $scope.instance.attrs.name = opts.name;
            $scope.$digest();
            cb();
          })
        };
        $scope.$digest();
      });
      it('renames properly', function(done) {
        var fakeGo = sinon.stub($state, 'go');
        mr.actions.renameInstance('test-rename', function() {
          expect($scope.popoverGearMenu.data.show).to.be.false;
          expect($scope.saving).to.be.false;
          $timeout.flush();
          expect($scope.saving).to.be.true;

          sinon.assert.called(fakeGo);
          sinon.assert.called($scope.instance.update);
          sinon.assert.calledWith(fakeGo,'instance.instance', {
            userName: 'username',
            instanceName: 'test-rename'
          });
          done();
        });
      });
      it('exits early if the name is the same', function() {
        mr.actions.renameInstance('properly');
        expect($scope.popoverGearMenu.data.show).to.be.false;
        sinon.assert.notCalled($scope.instance.update);
      });
    });
    describe('cancel'.blue, function() {
      it('should properly set variables', function() {
        mr.actions.cancel();
        expect($scope.popoverGearMenu.data.show).to.be.false;
      });
    });
  });

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
        $scope.items = makeFakeItems(true, false);

        $scope.items.forEach(function (item) {
          item.opts.name = 'test-test';
        });
        var fakeGo = sinon.stub($state, 'go');
        dmf.actions.forkInstance($scope.items, function (err) {
          if (err) { return done(err); }
          // scope changes
          expect($scope.popoverGearMenu.data.show).to.be.false;
          expect($rootScope.dataApp.data.loading).to.be.true;

          sinon.assert.called(fakeGo);
          sinon.assert.called($scope.items[0].instance.copy);
          sinon.assert.calledWith(fakeGo,'instance.instance', {
            userName: 'username',
            instanceName: 'test-test'
          });
          done();
        });
      });

      it('should function properly with a single instance with env', function(done) {
        $scope.items = makeFakeItems(true, false);

        $scope.items.forEach(function (item) {
          item.opts.name = 'test-test';
        });

        var fakeGo = sinon.stub($state, 'go');
        dmf.actions.forkInstance($scope.items, function (err) {
          if (err) { return done(err); }
          // scope changes
          expect($scope.popoverGearMenu.data.show).to.be.false;
          expect($rootScope.dataApp.data.loading).to.be.true;

          sinon.assert.called(fakeGo);
          sinon.assert.called($scope.items[0].instance.copy);
          sinon.assert.calledWith(fakeGo,'instance.instance', {
            userName: 'username',
            instanceName: 'test-test'
          });
          done();
        });
      });

      it('should work with dependent instances', function(done) {
        $scope.items = makeFakeItems(true, true);
        var stubUpdate = sinon.stub($scope.items[0].instance.dependencies.models);

        $scope.items.forEach(function (item) {
          item.opts.name = 'test-test';
        });

        var fakeGo = sinon.stub($state, 'go');

        dmf.actions.forkInstance($scope.items, function (err) {
          if (err) { return done(err); }
          // scope changes
          expect($scope.popoverGearMenu.data.show).to.be.false;
          expect($rootScope.dataApp.data.loading).to.be.true;

          var dep = $scope.items[0].instance.dependencies.models[0];
          sinon.assert.called(dep.copy);

          sinon.assert.called(fakeGo);
          sinon.assert.called($scope.items[0].instance.copy);
          sinon.assert.calledWith(fakeGo,'instance.instance', {
            userName: 'username',
            instanceName: 'test-test'
          });
          done();
        });
      });

      it('should not fork dependent instances when not requested', function(done) {
        $scope.items = makeFakeItems(true, true);
        $scope.items.splice(1);
        $scope.items.forEach(function (item) {
          item.opts.name = 'test-test';
        });
        var fakeGo = sinon.stub($state, 'go');
        dmf.actions.forkInstance($scope.items, function (err) {
          if (err) { return done(err); }
          // scope changes
          expect($scope.popoverGearMenu.data.show).to.be.false;
          expect($rootScope.dataApp.data.loading).to.be.true;

          var dep = $scope.items[0].instance.dependencies.models[0];
          sinon.assert.notCalled(dep.copy);

          sinon.assert.called(fakeGo);
          sinon.assert.called($scope.items[0].instance.copy);
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
        expect($scope.popoverGearMenu.data.show).to.be.false;
      });
    });
  });

 describe('actionsModalDelete', function() {
    var md;
    beforeEach(initState);
    beforeEach(function() {
      md = {
        data: $scope.popoverGearMenu.data.dataModalDelete,
        actions: $scope.popoverGearMenu.actions.actionsModalDelete
      };
    });
    describe('deleteInstance'.blue, function() {
      var instance;
      beforeEach(function() {
        $scope.instance = {
          attrs: {
            name: 'properly'
          },
          destroy: sinon.spy(function(cb) {
            cb();
          })
        };
        $stateParams.instanceName = 'properly';
        $scope.$digest();
      });
      it('deletes properly with no other instances', function(done) {
        var fakeGo = sinon.stub($state, 'go', function() {

          sinon.assert.called(fakeGo);
          sinon.assert.called($scope.instance.destroy);
          sinon.assert.calledWith(fakeGo,'instance.home', {
            userName: 'username'
          });
          done();
        });
        $scope.instances = {
          models: []
        };
        $scope.$digest();
        md.actions.deleteInstance();
      });
      describe('deletes properly with other instances', function() {
        it('staying on the same page, should navigate to the other instance', function(done) {
          var fakeGo = sinon.stub($state, 'go', function() {

            sinon.assert.called(fakeGo);
            sinon.assert.called($scope.instance.destroy);
            sinon.assert.calledWith(fakeGo,'instance.home', {
              userName: 'username'
            });
            done();
          });
          $scope.instances = {
            models: [{
              attrs: {
                name: 'other'
              }
            }]
          };
          $scope.$digest();
          md.actions.deleteInstance();
        });
        it('changing pages between the delete, should not navigate away', function(done) {
          var fakeGo = sinon.stub($state, 'go', function() {});
          $scope.instances = {
            models: [{
              attrs: {
                name: 'other'
              }
            }, {
              attrs: {
                name: 'cheese'
              }
            }]
          };
          $scope.instance.destroy = sinon.spy(function(cb) {
            // Change the state during the destroy
            $stateParams.instanceName = 'cheese';
            setTimeout(function() {
              sinon.assert.notCalled(fakeGo);
              sinon.assert.called($scope.instance.destroy);
              sinon.assert.neverCalledWith(fakeGo,'instance.home', {
                userName: 'username'
              });
              done();
            }, 50);
            cb();
          });
          $scope.$digest();
          md.actions.deleteInstance();
        });
      });

    });
    describe('cancel'.blue, function() {
      it('should properly set variables', function() {
        md.actions.cancel();
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
