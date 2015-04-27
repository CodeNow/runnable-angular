'use strict';

// injector-provided
var $rootScope,
    $scope,
    $compile,
    $templateCache;
var $elScope;
var thisUser;

var apiMocks = require('../../../apiMocks/index');
var ctx;

var stacks = angular.copy(apiMocks.stackInfo);
var MockFetch = require('../../../fixtures/mockFetch');
var branchesMock = eval(apiMocks.branches.bitcoinRepoBranches);

function makeDefaultScope() {
  return {
    data: {
      instances: [apiMocks.instances.building, apiMocks.instances.running],
      activeAccount: ctx.fakeuser,
      orgs: {models: [ctx.fakeOrg1, ctx.fakeOrg2]},
      user: ctx.fakeuser,
      stacks: stacks
    },
    actions: {
      addDependency: sinon.spy(),
      removeDependency: sinon.spy(),
      changeStep: sinon.spy(),
      nextStep: sinon.spy(),
      skipTutorial: sinon.spy(),
      createAndBuild: sinon.spy()
    },
    state: {
      things: {}
    }
  };
}

var analysisMockData = {
  serviceDependencies: ['mongodb', 'redis'],
  languageFramework: 'node',
  version: {
    node: '0.10.35',
    ruby: '0.10',
    rails: '4.1.7'
  }
};

function makeMockRepoList(username, json) {
  var repoList = runnable.newGithubRepos(json, {noStore: true});
  repoList.ownerUsername = username;
  return repoList;
}


/**
 * Things to test:
 *   Should only be able to select 1 repo
 *   Stale repo fetch data should not replace correct data
 *   Switching accounts should trigger new fetch of repos
 *   Selecting a repo should trigger a stack analysis
 */
// Skipping pending Nate review
describe.skip('directiveGsRepoSelector'.bold.underline.blue, function () {
  beforeEach(function () {
    ctx = {};
  });

  function injectSetupCompile() {
    ctx.errsMock = {
      handler: sinon.spy()
    };
    ctx.fetchRepoListMock = new MockFetch();
    ctx.analysisMockData = angular.copy(analysisMockData);
    ctx.fetchStackAnalysisMock = new MockFetch();

    ctx.fetchOwnerReposMock = new MockFetch();
    runnable.reset(apiMocks.user);

    angular.mock.module('app', function ($provide) {
      $provide.value('errs', ctx.errsMock);
      $provide.factory('fetchRepoList', ctx.fetchRepoListMock.fetch());
      $provide.factory('fetchStackAnalysis', ctx.fetchStackAnalysisMock.fetch());
      $provide.factory('fetchOwnerRepos', ctx.fetchOwnerReposMock.fetch());
    });
    angular.mock.inject(function (
      _$templateCache_,
      _$compile_,
      _$rootScope_
    ) {
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
      $templateCache = _$templateCache_;
    });
    ctx.fakeuser = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'user';
      },
      gravitar: function () {
        return true;
      }
    };
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      },
      gravitar: function () {
        return true;
      }
    };
    ctx.fakeOrg2 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org2';
      },
      gravitar: function () {
        return true;
      }
    };
    ctx.repo1 = {
      attrs: angular.copy(apiMocks.gh.repos),
      branches: {
        fetch: sinon.spy(function (cb) {
          cb();
        }),
        models: branchesMock.map(function (branch) {
          return {
            attrs: branch
          };
        })
      }
    };
    var scope = makeDefaultScope();
    Object.keys(scope).forEach(function (key) {
      $scope[key] = scope[key];
    });
    $scope.user = thisUser;

    ctx.template = directiveTemplate.attribute('gs-repo-selector', {
      'data': 'data',
      'actions': 'actions',
      'state': 'state'
    });

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  describe('Check that the directive added what it needs to the scope', function () {
    beforeEach(function () {
      injectSetupCompile();
    });
    it('should have everything on the scope that was given', function () {
      expect($elScope.data).to.be.ok;
      // Actions was modified, so just verify it exists
      expect($elScope.actions).to.be.ok;
      expect($elScope.actions.addDependency).to.be.a('function');
      expect($elScope.state).to.be.ok;

      expect($elScope.selectRepo).to.be.a('function');

      $scope.$destroy();
      $scope.$digest();
    });
  });

  describe('Check actions based on switching accounts', function () {
    beforeEach(function () {
      injectSetupCompile();
    });
    it('should fetch repo list when the account changes', function () {
      $scope.data.activeAccount = ctx.fakeOrg1;
      $scope.$digest();
      expect($elScope.loading).to.be.true;
      expect($elScope.githubRepos).to.be.null;

      var repoList = makeMockRepoList('org1', apiMocks.repoList);
      ctx.fetchOwnerReposMock.triggerPromise(repoList);

      $rootScope.$digest();

      expect($elScope.loading).to.be.false;
      expect($elScope.githubRepos.models.length).to.equal(41);

      $scope.$destroy();
      $scope.$digest();
    });
    it('should ignore stale repolist data from a different user', function () {
      $scope.data.activeAccount = ctx.fakeOrg2;
      $scope.$digest();
      expect($elScope.loading).to.be.true;
      expect($elScope.githubRepos).to.be.null;

      var repoList = makeMockRepoList('org1', apiMocks.repoList);
      ctx.fetchOwnerReposMock.triggerPromise(repoList);

      $rootScope.$digest();

      $scope.data.activeAccount = ctx.fakeOrg1;
      $scope.$digest();

      expect($elScope.loading).to.be.true;
      expect($elScope.githubRepos).to.be.null;
      ctx.fetchOwnerReposMock.triggerPromise(repoList);
      $scope.$digest();

      expect($elScope.loading).to.be.false;
      expect($elScope.githubRepos.models.length).to.equal(41);

      $scope.$destroy();
      $scope.$digest();
    });
  });

  describe('Selecting a repo', function () {
    beforeEach(function () {
      injectSetupCompile();
    });
    it('should only allow 1 repo to be selected at a time', function () {
      $elScope.state.repoSelected = true;
      $scope.$digest();
      var repo = {
        attrs: angular.copy(apiMocks.gh.repos)
      };
      $elScope.selectRepo(repo);
      expect(repo.spin).to.not.be.ok;
      $scope.$destroy();
      $scope.$digest();
    });
    it('should try to fetch a whole ton of data after selecting a repo', function () {
      $elScope.selectRepo(ctx.repo1);
      expect($elScope.state.repoSelected, 'repoSelected').to.be.ok;
      expect(ctx.repo1.spin, 'repo1 spin').to.be.ok;
      expect($elScope.state.selectedRepo, 'selectedRepo').to.equal(ctx.repo1);
      sinon.assert.called(ctx.repo1.branches.fetch);
      $scope.$digest();

      expect($elScope.state.activeBranch, 'activeBranch').to.be.ok;
      expect($elScope.state.activeBranch.attrs.name).to.equal('master');

      ctx.fetchStackAnalysisMock.triggerPromise(ctx.analysisMockData);
      $scope.$digest();

      expect($elScope.state.stack.key).to.equal('node');
      sinon.assert.notCalled($scope.actions.addDependency);
      $scope.data.allDependencies = {
        models: [{
          attrs: {
            name: 'mongodb'
          }
        }, {
          attrs: {
            name: 'redis'
          }
        }, {
          attrs: {
            name: 'cheese'
          }
        }]
      };
      $scope.$digest();
      sinon.assert.calledWith($scope.actions.addDependency, $scope.data.allDependencies.models[0]);
      sinon.assert.calledWith($scope.actions.addDependency, $scope.data.allDependencies.models[1]);

      expect(ctx.repo1.spin, 'repo1 spin not check').to.not.be.ok;
      sinon.assert.calledWith($scope.actions.nextStep, 2);
      expect($elScope.state.repoSelected, 'repoSelected 2').to.be.ok;

      $scope.$destroy();
      $scope.$digest();
    });
    it('should select rails if the language detected isn\'t available', function () {
      ctx.analysisMockData = {
        serviceDependencies: ['mongodb', 'redis'],
        languageFramework: 'nope',
        version: {
          node: '0.10.35'
        }
      };
      $elScope.selectRepo(ctx.repo1);
      expect($elScope.state.repoSelected, 'repoSelected').to.be.ok;
      expect(ctx.repo1.spin, 'repo1 spin').to.be.ok;
      expect($elScope.state.selectedRepo, 'selectedRepo').to.equal(ctx.repo1);
      sinon.assert.called(ctx.repo1.branches.fetch);
      $scope.$digest();

      expect($elScope.state.activeBranch, 'activeBranch').to.be.ok;
      expect($elScope.state.activeBranch.attrs.name).to.equal('master');

      ctx.fetchStackAnalysisMock.triggerPromise(ctx.analysisMockData);
      //ctx.fetchStackAnalysisMock.triggerPromiseError(new Error('asdasd'));
      $scope.$digest();

      expect($elScope.state.stack.key).to.equal(stacks[0].key);

      $scope.$destroy();
      $scope.$digest();
    });
    it('should work fine without any dependencies', function () {
      ctx.analysisMockData = {
        languageFramework: 'node',
        version: {
          node: '0.10.35'
        }
      };
      $elScope.selectRepo(ctx.repo1);
      $scope.$digest();
      expect($elScope.state.repoSelected, 'repoSelected').to.be.ok;
      expect($elScope.state.selectedRepo, 'selectedRepo').to.equal(ctx.repo1);
      sinon.assert.called(ctx.repo1.branches.fetch);
      ctx.fetchStackAnalysisMock.triggerPromise(ctx.analysisMockData);
      $scope.$digest();

      sinon.assert.calledWith($scope.actions.nextStep, 2);
      expect(ctx.repo1.spin, 'repo 1 spin').to.not.be.ok;
      expect($elScope.state.repoSelected, 'repoSelected').to.be.ok;

      $scope.$destroy();
      $scope.$digest();
    });
    it('should fill in the selected versions for stack dependencies', function () {
      ctx.analysisMockData = {
        serviceDependencies: ['mongodb', 'redis'],
        languageFramework: 'rails',
        version: {
          ruby: '0.10',
          rails: '4.1.7'
        }
      };
      $elScope.selectRepo(ctx.repo1);
      expect($elScope.state.repoSelected).to.be.ok;
      expect(ctx.repo1.spin).to.be.ok;
      $scope.$digest();
      expect($elScope.state.selectedRepo).to.equal(ctx.repo1);
      sinon.assert.called(ctx.repo1.branches.fetch);
      ctx.fetchStackAnalysisMock.triggerPromise(ctx.analysisMockData);
      $scope.$digest();

      expect($elScope.state.stack.selectedVersion).to.equal('4.1.7');
      expect($elScope.state.stack.dependencies[0].selectedVersion).to.equal('0.10');

      $scope.$destroy();
      $scope.$digest();
    });
  });
  describe('Expected FAILURES', function () {
    beforeEach(function () {
      injectSetupCompile();
    });
    it('should err when repo list fails', function () {
      var err = new Error('dsfgasdfgads');

      ctx.fetchOwnerReposMock.triggerPromiseError(err);

      $rootScope.$digest();
      expect($elScope.loading).to.be.false;
      sinon.assert.calledWith(ctx.errsMock.handler, err);

      $scope.$destroy();
      $scope.$digest();
    });
    it('should err when the branches fetch fails', function () {
      var err = new Error('dsfgasdfgads');
      ctx.repo1.branches.fetch = sinon.spy(function(cb) {
        cb(err);
      });
      $elScope.selectRepo(ctx.repo1);
      $scope.$digest();
      sinon.assert.calledWith(ctx.errsMock.handler, err);
      $scope.$destroy();
      $scope.$digest();
    });
    it('should err when it can\'t find the master branch', function () {
      ctx.repo1.branches.models = [];
      $elScope.selectRepo(ctx.repo1);
      $rootScope.$digest();
      sinon.assert.called(ctx.repo1.branches.fetch);
      $scope.$digest();
      $scope.$digest();
      sinon.assert.calledWith(ctx.errsMock.handler, new Error('No branches found'));

      expect(ctx.repo1.spin, 'repo 1 spin').to.not.be.ok;
      $scope.$destroy();
      $scope.$digest();
    });
    it('should err when stack analysis fails', function () {
      ctx.analysisMockData = null;
      $elScope.selectRepo(ctx.repo1);
      $scope.$digest();
      sinon.assert.called(ctx.repo1.branches.fetch);
      var error = new Error('sadasdasd');
      ctx.fetchStackAnalysisMock.triggerPromiseError(error);
      $scope.$digest();
      sinon.assert.calledWith(ctx.errsMock.handler, error);

      expect(ctx.repo1.spin, 'repo 1 spin').to.not.be.ok;
      sinon.assert.neverCalledWith($scope.actions.nextStep, 2);
      expect($elScope.state.repoSelected).to.not.be.ok;
      $scope.$destroy();
      $scope.$digest();
    });
    it('should continue when stack analysis doesn\'t detect a language', function () {
      ctx.analysisMockData = {};
      $elScope.selectRepo(ctx.repo1);

      $scope.$digest();
      sinon.assert.called(ctx.repo1.branches.fetch);
      ctx.fetchStackAnalysisMock.triggerPromise(ctx.analysisMockData);
      $scope.$digest();

      expect(ctx.repo1.spin, 'repo 1 spin').to.not.be.ok;
      sinon.assert.calledWith($scope.actions.nextStep, 2);
      $scope.$destroy();
      $scope.$digest();
    });
  });
});
