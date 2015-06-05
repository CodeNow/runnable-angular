'use strict';

describe('repositoryFormDirective'.bold.underline.blue, function () {
  var ctx;
  var $timeout;
  var $scope;
  var $compile;
  var $elScope;
  var $rootScope;
  var keypather;

  var apiMocks = require('../apiMocks/index');
  function setup(scope, updateError) {
    ctx = {};
    ctx.errsMock = {
      handler: sinon.spy()
    };
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      }
    };
    ctx.acv = {
      attrs: angular.copy(apiMocks.appCodeVersions.bitcoinAppCodeVersion),
      update: sinon.spy(function (opts, cb) {
        if (updateError) {
          cb(updateError);
          return updateError;
        }
        return cb();
      }),
      resetState: sinon.spy(),
      setState: sinon.spy()
    };
    ctx.repo1 = {
      attrs: angular.copy(apiMocks.gh.repos[0]),
      branches: {
        fetch: sinon.spy(function (cb) {
          ctx.repo1.branches.models = apiMocks.branches.bitcoinRepoBranches.map(function (branch) {
            return {
              attrs: branch
            };
          });
          if (cb) { cb(null, ctx.repo1.branches); }
          return ctx.repo1.branches;
        }),
        models: []
      }
    };
    runnable.reset(apiMocks.user);
    angular.mock.module('app', function ($provide) {
      $provide.value('errs', ctx.errsMock);
    });
    angular.mock.inject(function (
      _$compile_,
      _$timeout_,
      _$rootScope_,
      _keypather_
    ) {
      $timeout = _$timeout_;
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
    });


    keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeOrg1);
    Object.keys(scope).forEach(function (key) {
      $scope[key] = scope[key];
    });

    ctx.template = directiveTemplate.attribute('repository-form', {
      'state': 'state',
      'start-command-can-disable': 'startCommandCanDisable'
    });
    ctx.element = $compile(ctx.template)($scope);
  }
  describe('basic', function () {
    it('Check the scope', function () {
      var scope = {
        data: {
          stacks: apiMocks.stackInfo
        },
        state: {
          cheese: {
            hello: 'jello'
          }
        },
        startCommandCanDisable: true
      };
      setup(scope);
      $scope.$digest();
      $elScope = ctx.element.isolateScope();
      $scope.$digest();
      expect($elScope.data).to.not.be.ok;
      expect($elScope.state).to.equal(scope.state);
      expect($elScope.startCommandCanDisable).to.be.true;
      $rootScope.$destroy();
    });
  });
  describe('starting up', function () {

    it('for the first time', function () {

      var scope = {
        state: {}
      };
      setup(scope);
      $scope.$digest();
      $elScope = ctx.element.isolateScope();
      $scope.$digest();

      $scope.state.repo = ctx.repo1;
      $scope.$digest();
      $scope.state.acv = ctx.acv;
      $scope.$digest();
      $rootScope.$apply();

      sinon.assert.called(ctx.repo1.branches.fetch);
      $scope.$digest();
      expect($scope.state.branch, 'branch').to.be.ok;
      expect($scope.state.branch.attrs.name, 'branch name').to.equal('master');
      $scope.$digest();
      sinon.assert.notCalled(ctx.acv.update);
      sinon.assert.notCalled(ctx.acv.setState);

      // Now make a change
      var newBranch = ctx.repo1.branches.models[0];
      $elScope.state.branch = newBranch;
      $scope.$digest();
      var newState = {
        branch: newBranch.attrs.name,
        commit: newBranch.attrs.commit.sha
      };
      sinon.assert.calledWith(ctx.acv.setState, newState);
      sinon.assert.calledWith(ctx.acv.update, newState);
      $scope.$digest();
      sinon.assert.calledOnce(ctx.acv.resetState);
      $rootScope.$destroy();
    });
    it('coming back to the page', function () {
      setup({
        state: {}
      });
      $scope.state.acv = ctx.acv;
      $scope.state.repo = ctx.repo1;
      $scope.state.branch = {
        attrs: apiMocks.branches.bitcoinRepoBranches[0]
      };

      ctx.repo1.branches.fetch();
      ctx.repo1.branches.fetch.reset();
      $scope.$digest();
      $elScope = ctx.element.isolateScope();
      $scope.$digest();

      sinon.assert.notCalled(ctx.repo1.branches.fetch);
      $scope.$digest();
      sinon.assert.notCalled(ctx.acv.update);
      sinon.assert.notCalled(ctx.acv.setState);

      // Now make a change
      var newBranch = ctx.repo1.branches.models[1];
      $elScope.state.branch = newBranch;
      $scope.$digest();
      var newState = {
        branch: newBranch.attrs.name,
        commit: newBranch.attrs.commit.sha
      };
      sinon.assert.calledWithMatch($scope.state.acv.setState, newState);
      sinon.assert.calledWithMatch($scope.state.acv.update, newState);
      $scope.$digest();
      sinon.assert.calledOnce($scope.state.acv.resetState);
      $rootScope.$destroy();
    });
  });

  describe('errors', function () {
    it('failing on update', function () {
      var error = new Error('sadasdasd');
      setup({
        state: {}
      }, error);
      $scope.state.acv = ctx.acv;
      $scope.state.repo = ctx.repo1;
      $scope.state.branch = {
        attrs: apiMocks.branches.bitcoinRepoBranches[0]
      };
      ctx.repo1.branches.fetch();
      ctx.repo1.branches.fetch.reset();
      $scope.$digest();
      $elScope = ctx.element.isolateScope();
      $scope.$digest();
      // Now make a change
      var newBranch = ctx.repo1.branches.models[1];
      $elScope.state.branch = newBranch;
      $scope.$digest();
      $scope.$digest();
      var newState = {
        branch: newBranch.attrs.name,
        commit: newBranch.attrs.commit.sha
      };
      sinon.assert.calledWithMatch($scope.state.acv.setState, newState);
      sinon.assert.calledWithMatch($scope.state.acv.update, newState);
      sinon.assert.calledWith(ctx.errsMock.handler, error);
      $scope.$digest();
      sinon.assert.calledOnce($scope.state.acv.resetState);
    });
  });
});