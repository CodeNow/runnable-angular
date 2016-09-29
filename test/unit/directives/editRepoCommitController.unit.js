'use strict';

describe('EditRepoCommitController'.bold.underline.blue, function() {
  var apiMocks = require('../apiMocks/index');
  var updateInstanceWithNewAcvDataStub;
  var $scope;
  var ctx;
  var $rootScope;
  var $controller;
  var keypather;
  var $q;
  var editRepoCommitController;
  var ERCC;
  var getCommitStub;
  var commits;
  var acvMock;
  var newBranchStub;

  function setup() {
    ctx = {};
    ctx.branch = {attrs: apiMocks.branches.bitcoinRepoBranches[0]};
    ctx.commit = {attrs: apiMocks.commit.bitcoinRepoCommit1};
    getCommitStub = sinon.stub().returns({models: [ctx.commit]});
    newBranchStub = sinon.stub().returns({
      commits: {
        fetch: getCommitStub
      }
    })
    acvMock = {
      attrs: {
        repo: 'foo/bar',
        commit: 'commitSha'
      },
      githubRepo: {
        newBranch: newBranchStub
      }
    };
    commits = {models: [apiMocks.commit.bitcoinRepoCommit2, ctx.commit]};
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchCommitData', function ($q) {
        ctx.fetchCommitData = {
          activeBranch: sinon.spy(function () {
            return ctx.branch;
          }),
          activeCommit: sinon.stub().returns($q.when(ctx.commit)),
          offset: sinon.spy(),
          branchCommits: sinon.spy()
        };
        return ctx.fetchCommitData;
      });
      $provide.factory('updateInstanceWithNewAcvData', function($q) {
        updateInstanceWithNewAcvDataStub = sinon.stub().returns($q.when(true));
        return updateInstanceWithNewAcvDataStub;
      });
      $provide.factory('promisify', function ($q) {
        var promisifyMock = sinon.spy(function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyMock;
      });
    });

    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$q_,
      _keypather_
    ) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $q = _$q_;
      keypather = _keypather_;
    });
    $scope = $rootScope.$new();
    $scope.model = acvMock;
    $scope.instance = ctx.instance = {
      update: sinon.stub(),
      attrs: {
        locked: false
      }
    };
    ctx.changeCommitSpy = sinon.spy();
    $scope.$on('change-commit', ctx.changeCommitSpy);
    editRepoCommitController = $controller('EditRepoCommitController', {
      '$scope': $scope
    }, {
      instance: $scope.instance,
      acv: $scope.model
    });
    $scope.ERCC = editRepoCommitController;
    $rootScope.$digest();
  }

  beforeEach(function () {
    setup();
  });


  describe('actions', function () {
    it('should fetch the active commit', function () {
      expect($scope.ERCC.activeCommit).to.equal(ctx.commit);
      sinon.assert.calledOnce(ctx.fetchCommitData.activeCommit);
    });

    it('toggleEditCommits should setup popoverRepositoryToggle data', function () {
      $scope.ERCC.actions.toggleEditCommits();
      sinon.assert.calledOnce(ctx.fetchCommitData.branchCommits);
      expect($scope.ERCC.popoverRepositoryToggle.data.branch).to.equal(ctx.branch);
      expect($scope.ERCC.popoverRepositoryToggle.data.commit).to.equal(ctx.commit);
    });

    it('popoverRepositoryToggle.selectCommit should emit an update event and update the current ACV', function () {
      var sha = 'myCommitSha1234';
      $scope.ERCC.popoverRepositoryToggle.actions.selectCommit(sha);

      sinon.assert.calledOnce(ctx.changeCommitSpy);
      expect(ctx.changeCommitSpy.lastCall.args[1]).to.equal(sha);

      expect($scope.model.attrs.commit).to.equal(sha);
    });
    
    it('should trigger update on change of locked attribute', function () {
      expect($scope.ERCC.autoDeploy()).to.not.be.ok;

      $scope.ERCC.autoDeploy(true);
      $scope.$digest();
      sinon.assert.calledOnce(ctx.instance.update);
      sinon.assert.calledWith(ctx.instance.update, {locked: true});
    });

    it('should not allow changing while its already changing the locked attr', function () {
      expect($scope.ERCC.autoDeploy()).to.not.be.ok;

      var resolvePromise;
      ctx.instance.update = sinon.stub().returns($q(function (resolve) {
        resolvePromise = resolve;
      }));

      $scope.ERCC.autoDeploy(true);

      $scope.$digest();

      var rtn = $scope.ERCC.autoDeploy(false);
      expect(rtn).to.be.ok;

      sinon.assert.calledOnce(ctx.instance.update);
      sinon.assert.calledWith(ctx.instance.update, {locked: true});
    });
  });

  describe('recognizing that the latest commit is deployed', function() {
    it('should compare the latest and deployed commit', function () {
      $scope.$digest();
      expect($scope.ERCC.isLatestCommitDeployed).to.equal(true);
    });
  });

  describe('updating the instance when new commits are made', function() {
    beforeEach(function() {
      getCommitStub.returns(commits);
      $scope.ERCC.acv = {
        attrs: {
          repo: 'foo/bar',
          commit: 'commitSha'
        },
        githubRepo: {
          newBranch: newBranchStub
      }};
      $scope.$digest();
    });

    it('should show a discrepancy when there is a new commit', function () {
      expect($scope.ERCC.isLatestCommitDeployed).to.equal(false);
    });

    it('should update the instance when triggered by user', function () {
      getCommitStub.reset();
      $scope.ERCC.updateInstance();
      $scope.$digest();
      expect($scope.ERCC.latestBranchCommit.attrs.sha).to.equal(commits.models[0].attrs.sha);
      sinon.assert.calledOnce(getCommitStub);
      sinon.assert.calledOnce(updateInstanceWithNewAcvDataStub);
    });
  });
});
