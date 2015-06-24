'use strict';

describe('directiveRepoSelect'.bold.underline.blue, function () {
  var element;
  var $scope;
  var $rootScope;
  var keypather;
  var $q;

  var currentConfig;
  var fetchOwnerRepoStub;
  var fetchRepoBranchesStub;

  var ctx;
  function initState(config) {
    ctx = {};
    ctx.commits = [
      {
        name: 'This is a commit message!'
      }
    ];
    ctx.branches = {
      models: [
        {
          attrs: {
            name: 'master'
          }
        },
        {
          attrs: {
            name: 'default'
          },
          commits: {
            fetch: sinon.stub().returns({
              models: ctx.commits
            }),
            models: ctx.commits
          }
        }
      ]
    };
    ctx.repo = {
      attrs: {
        name: 'My Repo Name',
        default_branch: 'default'
      },
      fetchBranches: sinon.spy(function (opts, cb) {
        $rootScope.$evalAsync(function () {
          cb(null, {
            models: ctx.branches
          });
        });
        ctx.repo.branches = {
          models: ctx.branches
        };
        return ctx.repo.branches;
      }),
      newBranches: sinon.spy(function (branches) {
        return {
          models: branches
        };
      })
    };

    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.factory('fetchOwnerRepos', function ($q) {
        runnable.reset(mocks.user);
        fetchOwnerRepoStub = sinon.stub().returns(
          $q.when(
            runnable.newGithubRepos(
              mocks.repoList, {
                noStore: true
              }
            )
          )
        );
        return fetchOwnerRepoStub;
      });
      $provide.factory('fetchRepoBranches', function ($q) {
        runnable.reset(mocks.user);
        fetchRepoBranchesStub = sinon.stub().returns(
          $q.when(
            ctx.branches
          )
        );
        return fetchRepoBranchesStub;
      });
    });

    angular.mock.inject(function (
      $compile,
      _$rootScope_,
      _keypather_,
      _$q_
    ) {
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      $q = _$q_;

      keypather.set($rootScope, 'dataApp.data.activeAccount.oauthName', sinon.mock().returns('myOauthName'));

      $scope = $rootScope.$new();

      if(!config){
        config = {};
      }

      if (!config.actions) {
        config.actions = {
          create: sinon.mock().returns($q.when()),
          remove: sinon.mock().returns($q.when()),
          update: sinon.mock().returns($q.when())
        };
      }

      if (!keypather.get(config, 'data.appCodeVersions')) {
        keypather.set(config, 'data.appCodeVersions', []);
      }

      currentConfig = config;
      $scope.actions = config.actions;
      $scope.data = config.data;
      var tpl = directiveTemplate.attribute('repository-selector', {
        'actions': 'actions',
        'data': 'data'
      });
      element = $compile(tpl)($scope);
      $scope.$digest();
    });
  }

  describe('with no data passed in', function () {
    beforeEach(function () {
      initState();
    });

    it('should load repo list and default it\'s state to view 1', function () {
      sinon.assert.called($rootScope.dataApp.data.activeAccount.oauthName);
      sinon.assert.calledOnce(fetchOwnerRepoStub);
      expect($scope.repoSelector.data.githubRepos.models).to.exist;
      expect($scope.state.view).to.equal(1);
    });

    it('should load the default branch and its commits when a repo is selected', function () {
      $scope.repoSelector.actions.selectRepo(ctx.repo);
      $scope.$digest();

      sinon.assert.calledOnce(fetchRepoBranchesStub);
      sinon.assert.calledOnce(ctx.branches.models[1].commits.fetch);
      expect($scope.repoSelector.data.commit).to.equal(ctx.commits[0]);
      expect($scope.repoSelector.data.name).to.equal('My Repo Name');
    });

    it('should load the commits when a branch is selected', function () {
      var commits = [
        {
          name: 'This is a commit message!'
        }
      ];
      var branch = {
        attrs: {
          name: 'default'
        },
        commits: {
          fetch: sinon.stub().returns({
            models: commits
          })
        }
      };

      $scope.repoSelector.actions.selectBranch(branch);
      $scope.$digest();

      sinon.assert.calledOnce(branch.commits.fetch);
      expect($scope.repoSelector.data.branch).to.equal(branch);
    });

    it('should change the view when a commit is selected', function () {
      var commit = {
        test: '1234'
      };
      $scope.repoSelector.actions.selectCommit(commit);

      expect($scope.state.view).to.equal(2);
      expect($scope.repoSelector.data.commit).to.equal(commit);
    });

    it('should trigger create on save', function () {
      $scope.repoSelector.actions.save();
      $scope.$digest();

      sinon.assert.calledOnce(currentConfig.actions.create);
      sinon.assert.notCalled(currentConfig.actions.update);
    });

    it('should set view to 2 when leaving commit select', function () {
      $scope.repoSelector.actions.leaveCommitSelect();
      $scope.$digest();

      expect($scope.state.view).to.equal(2);
    });
  });

  describe('with data', function () {
    beforeEach(function () {
      initState({
        data: {
          repo: {
            repo: ctx.repo
          }
        }
      });
    });

    it('should fetch branches on startup', function () {
      $scope.$digest();
      sinon.assert.calledOnce(fetchRepoBranchesStub);
    });

    it('should trigger update on save', function () {
      $scope.repoSelector.actions.save();
      $scope.$digest();
      sinon.assert.calledOnce(fetchRepoBranchesStub);

      sinon.assert.notCalled(currentConfig.actions.create);
      sinon.assert.calledOnce(currentConfig.actions.update);
    });

    it('should trigger remove on remove function', function () {
      $scope.repoSelector.actions.remove();
      $scope.$digest();

      sinon.assert.calledOnce(currentConfig.actions.remove);
    });
  });

  describe('when is gitDataOnly', function () {
    beforeEach(function () {
      initState({
        data:{
          gitDataOnly: true
        }
      });
    });

    it('should trigger save when a commit is selected', function () {
      var commit = {
        test: '1234'
      };
      $scope.repoSelector.actions.selectCommit(commit);
      $scope.$digest();

      expect($scope.repoSelector.data.commit).to.equal(commit);
      sinon.assert.calledOnce(currentConfig.actions.create);
    });

    it('should not allow me to select a new commit if I am already saving', function () {
      var commit = {
        test: '1234'
      };
      $scope.state.saving = true;
      $scope.repoSelector.actions.selectCommit(commit);
      $scope.$digest();
      sinon.assert.notCalled(currentConfig.actions.create);
    });

    it('should set view to 1 when leaving commit select', function () {
      $scope.repoSelector.actions.leaveCommitSelect();
      $scope.$digest();

      expect($scope.state.view).to.equal(1);
    });
  });
});
