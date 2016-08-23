'use strict';

describe('directiveRepositorySelector'.bold.underline.blue, function () {
  var $scope;
  var $rootScope;
  var keypather;
  var $timeout;
  var $q;

  var currentConfig;
  var fetchOwnerRepoStub;
  var mockCurrentOrg;

  var ctx;
  function initState(config) {
    mockCurrentOrg = {
      github: {
        oauthName: sinon.stub().returns('myOauthName')
      }
    };
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
      ],
      add: sinon.spy()
    };
    ctx.repo = {
      attrs: {
        name: 'My Repo Name',
        default_branch: 'default'
      },
      branches: ctx.branches,
      fetchBranches: sinon.spy(function (opts, cb) {
        $rootScope.$evalAsync(function () {
          cb(null, ctx.branches);
        });
        return ctx.branches;
      }),
      newBranch: sinon.spy(function (branchName) {
        return ctx.branches.models.find(function (branch) {
          return branchName === branch.attrs.name;
        });
      }),
      newBranches: sinon.spy(function (branches) {
        return {
          models: branches
        };
      })
    };

    angular.mock.module('app', function ($provide) {
      $provide.value('currentOrg', mockCurrentOrg);
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
      $provide.factory('branchCommitSelectorDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
    });

    angular.mock.inject(function (
      $compile,
      _$rootScope_,
      _keypather_,
      _$q_,
      _$timeout_
    ) {
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      $q = _$q_;
      $timeout = _$timeout_;

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
      ctx.goToPanelWatcher = sinon.spy();
      $scope.$on('go-to-panel', function (evt, name, opts) {
        ctx.goToPanelWatcher(name, opts);
      });

      var tpl = directiveTemplate.attribute('repository-selector', {
        'actions': 'actions',
        'data': 'data'
      });
      $compile(tpl)($scope);
      $scope.$digest();
      $timeout.flush();
    });
  }

  describe('with no data passed in', function () {
    beforeEach(function () {
      initState();
    });

    it('should load repo list and default it\'s view to repoSelect', function () {
      sinon.assert.called(mockCurrentOrg.github.oauthName);
      sinon.assert.calledOnce(fetchOwnerRepoStub);
      expect($scope.repoSelector.data.githubRepos.models).to.exist;


      sinon.assert.called(ctx.goToPanelWatcher);
      sinon.assert.calledWith(ctx.goToPanelWatcher, 'repoSelect', 'immediate');
    });

    it('should load the default branch and its commits when a repo is selected', function () {
      $scope.repoSelector.actions.selectRepo(ctx.repo);
      $scope.$digest();

      sinon.assert.calledOnce(ctx.repo.newBranch);
      sinon.assert.calledOnce(ctx.branches.models[1].commits.fetch);
      expect($scope.repoSelector.data.commit).to.equal(ctx.commits[0]);
      expect($scope.repoSelector.data.name).to.equal('My Repo Name');
    });

    it('should change the view when a commit is selected', function () {
      var commit = {
        test: '1234'
      };
      $scope.$broadcast('commit::selected', commit);

      sinon.assert.calledWith(ctx.goToPanelWatcher, 'repoOptions', 'back');
    });

    it('should trigger create on save', function () {
      $scope.repoSelector.actions.save();
      $scope.$digest();

      sinon.assert.calledOnce(currentConfig.actions.create);
      sinon.assert.notCalled(currentConfig.actions.update);
    });

    it('should set view to repoOptions when leaving commit select', function () {
      $scope.repoSelector.actions.leaveCommitSelect();
      $scope.$digest();

      sinon.assert.called(ctx.goToPanelWatcher);
      sinon.assert.calledWith(ctx.goToPanelWatcher, 'repoOptions', 'back');
    });
  });

  describe('with data', function () {
    beforeEach(function () {
      initState({
        data: {
          repo: {
            repo: ctx.repo,
            branch: ctx.branches.models[1]
          }
        }
      });
    });

    it('should fetch branches on startup', function () {
      $scope.$digest();
      sinon.assert.notCalled(fetchOwnerRepoStub);
    });

    it('should trigger update on save', function () {
      $scope.repoSelector.actions.save();
      $scope.$digest();

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
          gitDataOnly: true,
          repo: {}
        }
      });
    });

    it('should not trigger save when a commit is selected', function () {
      var commit = {
        test: '1234'
      };
      $scope.$broadcast('commit::selected', commit);
      $scope.$digest();

      sinon.assert.notCalled(currentConfig.actions.update);
    });

    it('should go to the commit view right away', function () {
      sinon.assert.called(ctx.goToPanelWatcher);
      sinon.assert.calledWith(ctx.goToPanelWatcher, 'commit', 'immediate');
    });

    it('should go to the commit panel when a repo is selected', function () {
      $scope.repoSelector.actions.selectRepo(ctx.repo);
      $scope.$digest();

      sinon.assert.called(ctx.goToPanelWatcher);
      sinon.assert.calledWith(ctx.goToPanelWatcher, 'commit');
    });


    it('should go to repoSelect when leaving commit select', function () {
      $scope.repoSelector.actions.leaveCommitSelect();
      $scope.$digest();

      sinon.assert.called(ctx.goToPanelWatcher);
      sinon.assert.calledWith(ctx.goToPanelWatcher, 'repoSelect', 'back');
    });
  });
});
