'use strict';

describe('branchCommitSelectorController'.bold.underline.blue, function () {
  var $scope;
  var $rootScope;
  var keypather;
  var $elScope;
  var $controller;
  var $q;
  var branchCommitSelectorController;

  var ctx;

  function initializeCtx() {
    ctx = {};
    ctx.commit = {
      name: 'This is a commit message!'
    };
    ctx.commits = {
      fetch: sinon.stub().returns({
        models: [ctx.commit]
      }),
      models: [ctx.commit]
    };
    ctx.branch = {
      attrs: {
        name: 'default'
      },
      commits: ctx.commits
    };
  }
  function initState() {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.factory('branchSelectorDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
    });

    angular.mock.inject(function (
      $compile,
      _$controller_,
      _$rootScope_,
      _keypather_,
      _$q_
    ) {
      $controller = _$controller_;
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      $q = _$q_;

      $scope = $rootScope.$new();

      $scope.data = {};

      branchCommitSelectorController = $controller('BranchCommitSelectorController', {
        '$scope': $scope
      });
      $scope.$digest();
    });
  }
  beforeEach(function () {
    initializeCtx();
  });
  describe('Basics', function () {
    beforeEach(function () {
      initState();
    });
    it('Check the construction', function () {
      $scope.$digest();
      expect(branchCommitSelectorController.onCommitFetch, 'onCommitFetch').to.be.function;
      expect(branchCommitSelectorController.isLatestCommit, 'useLatest').to.be.function;
      expect(branchCommitSelectorController.selectCommit, 'selectCommit').to.be.function;
    });

    it('should reset the commit if it cant find the current one in the list', function () {
      branchCommitSelectorController.data = {
        useLatest: true,
        branch: ctx.branch,
        commit: {
          sadsa: 'asdasd'
        }
      };
      $scope.$digest();
      branchCommitSelectorController.onCommitFetch(ctx.commits);
      $scope.$digest();
      expect(branchCommitSelectorController.data.commit, 'data.commit').to.equal(ctx.commits.models[0]);
      $rootScope.$destroy();
    });

    it('should leave the commit if it can find the current one in the list', function () {
      var newCommit = {
        sadsa: 'asdasd'
      };
      ctx.commits.models.push(newCommit);
      branchCommitSelectorController.data = {
        useLatest: true,
        branch: ctx.branch,
        commit: newCommit
      };
      $scope.$digest();
      branchCommitSelectorController.onCommitFetch(ctx.commits);
      $scope.$digest();
      expect(branchCommitSelectorController.data.commit, 'data.commit').to.equal(newCommit);
      $rootScope.$destroy();
    });

    it('useLatest works as a getter and setter', function () {
      branchCommitSelectorController.data = {
        useLatest: true,
        branch: ctx.branch
      };
      $scope.$digest();
      expect(branchCommitSelectorController.isLatestCommit(), 'useLatest').to.be.true;
      branchCommitSelectorController.isLatestCommit(false);
      expect(branchCommitSelectorController.isLatestCommit(), 'useLatest').to.be.false;
      expect(branchCommitSelectorController.data.useLatest, 'data.useLatest').to.be.false;
      expect(branchCommitSelectorController.data.commit, 'data.commit').to.equal(ctx.commits.models[0]);
      $rootScope.$destroy();
    });
    it('useLatest emits commit::selected on set true, not false', function () {
      branchCommitSelectorController.data = {
        useLatest: true,
        branch: ctx.branch
      };
      var commitSelectedSpy = sinon.spy();
      $rootScope.$on('commit::selected', commitSelectedSpy);
      $scope.$digest();
      expect(branchCommitSelectorController.isLatestCommit(), 'useLatest').to.be.true;
      branchCommitSelectorController.isLatestCommit(false);
      sinon.assert.notCalled(commitSelectedSpy);
      expect(branchCommitSelectorController.isLatestCommit(), 'useLatest').to.be.false;
      branchCommitSelectorController.isLatestCommit(true);
      sinon.assert.calledOnce(commitSelectedSpy);

      expect(branchCommitSelectorController.data.useLatest, 'data.useLatest').to.be.true;
      expect(branchCommitSelectorController.data.commit, 'data.commit').to.equal(ctx.commits.models[0]);
      $rootScope.$destroy();
    });

    it('should not set the commit when isLatest is true', function () {
      var fakeCommit = {
        asdasd: 'asdasd'
      };
      branchCommitSelectorController.data = {
        useLatest: true,
        branch: ctx.branch
      };
      $scope.$digest();

      expect(branchCommitSelectorController.isLatestCommit(), 'useLatest').to.be.true;

      branchCommitSelectorController.selectCommit(fakeCommit);
      $scope.$digest();
      expect(branchCommitSelectorController.isLatestCommit(), 'useLatest').to.be.true;
      expect(branchCommitSelectorController.data.useLatest, 'data.useLatest').to.be.true;
      expect(branchCommitSelectorController.data.commit, 'data.commit').to.not.equal(fakeCommit);
      $rootScope.$destroy();
    });

    it('should set the commit', function (done) {
      var fakeCommit = {
        asdasd: 'asdasd'
      };
      $rootScope.$on('commit::selected', function (event, commit) {
        expect(commit, 'data.commit').to.equal(fakeCommit);
        done();
      });
      branchCommitSelectorController.data = {
        useLatest: false,
        branch: ctx.branch
      };
      $scope.$digest();

      branchCommitSelectorController.selectCommit(fakeCommit);
      $scope.$digest();
      expect(branchCommitSelectorController.data.commit, 'data.commit').to.equal(fakeCommit);
      $rootScope.$destroy();
    });

    describe('isAutoDeployOn', function () {
      it('should return `useLatest` if its an additional repo', function () {
        branchCommitSelectorController.data = {
          useLatests: true,
          locked: false,
          acv: {
            additionalRepo: true
          }
        };
        expect(branchCommitSelectorController.isAutoDeployOn()).to.equal(true);
        $scope.$digest();
        $rootScope.$destroy();
      });

      it('should return `locked` if its not an additional repo', function () {
        branchCommitSelectorController.data = {
          useLatests: false,
          locked: true,
          acv: {
            additionalRepo: false
          }
        };
        expect(branchCommitSelectorController.isAutoDeployOn()).to.equal(false);
        branchCommitSelectorController.data.locked = false;
        expect(branchCommitSelectorController.isAutoDeployOn()).to.equal(true);
        $scope.$digest();
        $rootScope.$destroy();
      });
    });

    describe('autoDeploy', function () {
      beforeEach(function () {
        branchCommitSelectorController.data = {
          useLatests: false,
          locked: true,
          acv: {
            additionalRepo: false
          }
        };
        sinon.stub(branchCommitSelectorController, 'isAutoDeployOn').returns(true);
      });
      afterEach(function () {
        branchCommitSelectorController.isAutoDeployOn.restore();
      });

      it('should return `isAutoDeployOn` no arguments are passed', function () {
        expect(branchCommitSelectorController.autoDeploy()).to.equal(true);
        sinon.assert.calledOnce(branchCommitSelectorController.isAutoDeployOn);
        $scope.$digest();
        $rootScope.$destroy();
      });

      it('should set the `locked` property if passed', function () {
        branchCommitSelectorController.autoDeploy(true);
        expect(branchCommitSelectorController.data.locked).to.equal(false);
        sinon.assert.calledOnce(branchCommitSelectorController.isAutoDeployOn);
        branchCommitSelectorController.autoDeploy(false);
        expect(branchCommitSelectorController.data.locked).to.equal(true);
        sinon.assert.calledTwice(branchCommitSelectorController.isAutoDeployOn);
        $scope.$digest();
        $rootScope.$destroy();
      });
    });
  });
});
