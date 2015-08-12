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

      keypather.set($rootScope, 'featureFlags.additionalRepositories', true);
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
  describe('basics', function () {
    beforeEach(function () {
      initState();
    });
    it('Check the construction', function () {
      $scope.$digest();
      expect(branchCommitSelectorController.onCommitFetch, 'onCommitFetch').to.be.function;
      expect(branchCommitSelectorController.isLatestCommit, 'latestCommit').to.be.function;
      expect(branchCommitSelectorController.selectCommit, 'selectCommit').to.be.function;
    });

    it('should reset the commit if it cant find the current one in the list', function () {
      branchCommitSelectorController.data = {
        latestCommit: true,
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
        latestCommit: true,
        branch: ctx.branch,
        commit: newCommit
      };
      $scope.$digest();
      branchCommitSelectorController.onCommitFetch(ctx.commits);
      $scope.$digest();
      expect(branchCommitSelectorController.data.commit, 'data.commit').to.equal(newCommit);
      $rootScope.$destroy();
    });

    it('latestCommit works as a getter and setter', function () {
      branchCommitSelectorController.data = {
        latestCommit: true,
        branch: ctx.branch
      };
      $scope.$digest();
      expect(branchCommitSelectorController.isLatestCommit(), 'latestCommit').to.be.true;
      branchCommitSelectorController.isLatestCommit(false);
      expect(branchCommitSelectorController.isLatestCommit(), 'latestCommit').to.be.false;
      expect(branchCommitSelectorController.data.latestCommit, 'data.latestCommit').to.be.false;
      expect(branchCommitSelectorController.data.commit, 'data.commit').to.equal(ctx.commits.models[0]);
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
        latestCommit: true,
        branch: ctx.branch
      };
      $scope.$digest();

      expect(branchCommitSelectorController.isLatestCommit(), 'latestCommit').to.be.true;

      branchCommitSelectorController.selectCommit(fakeCommit);
      $scope.$digest();
      expect(branchCommitSelectorController.isLatestCommit(), 'latestCommit').to.be.false;
      expect(branchCommitSelectorController.data.latestCommit, 'data.latestCommit').to.be.false;
      expect(branchCommitSelectorController.data.commit, 'data.commit').to.equal(fakeCommit);
      $rootScope.$destroy();
    });
  });
});
