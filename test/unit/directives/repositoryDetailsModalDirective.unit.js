'use strict';

describe('repositoryDetailsModal'.bold.underline.blue, function () {
  var element;
  var $scope;
  var $rootScope;
  var keypather;
  var $elScope;
  var $q;

  var apiMocks = require('../apiMocks/index');
  var ctx;
  function initScope() {
    ctx = {};

    ctx.updateInstanceWithNewAcvDataMock = new (require('../fixtures/mockFetch'))();
    ctx.commits = [
      {
        name: 'This is a commit message!'
      }
    ];
    ctx.instance = runnable.newInstance(
      apiMocks.instances.running,
      {noStore: true}
    );
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
    ctx.defaultActions = {
      close: sinon.spy(function (cb) {
        cb();
      })
    };

    ctx.repo = {
      attrs: {
        name: 'My Repo Name',
        default_branch: 'default'
      }
    };
    ctx.appCodeVersion = {
      attrs: apiMocks.appCodeVersions.bitcoinAppCodeVersion,
      githubRepo: ctx.repo
    };
    ctx.branch = {attrs: apiMocks.branches.bitcoinRepoBranches[0]};
    ctx.commit = {attrs: apiMocks.commit.bitcoinRepoCommit1};
    ctx.fetchCommitData = {
      activeBranch: sinon.spy(function () {
        return ctx.branch;
      }),
      activeCommit: sinon.spy(function () {
        return ctx.commit;
      }),
      offset: sinon.spy(),
      branchCommits: sinon.spy()
    };
    ctx.loading = sinon.spy();
  }

  function setup(scope) {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.factory('updateInstanceWithNewAcvData', ctx.updateInstanceWithNewAcvDataMock.fetch());
      $provide.value('loading', ctx.loading);
      $provide.value('fetchCommitData', ctx.fetchCommitData);
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
      _$q_
    ) {
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      $q = _$q_;

      keypather.set($rootScope, 'featureFlags.additionalRepositories');
      $scope = $rootScope.$new();

      angular.extend($scope, scope);

      var tpl = directiveTemplate.attribute('repository-details-modal', {
        'data': 'data',
        'current-model': 'currentModel',
        'default-actions': 'defaultActions'
      });
      element = $compile(tpl)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  }
  describe('with data', function () {
    beforeEach(function () {
      initScope();
      ctx.appCodeVersion.attrs.useLatest = true;
    });
    beforeEach(function () {
      setup({
        data: ctx.instance,
        currentModel: ctx.appCodeVersion,
        defaultActions: ctx.defaultActions
      });
    });
    it('should set up the data object', function () {
      $scope.$digest();

      expect($elScope.RDMC.instance, 'instance').to.equal(ctx.instance);
      expect($elScope.RDMC.appCodeVersion, 'appCodeVersion').to.equal(ctx.appCodeVersion);
      expect($elScope.RDMC.defaultActions, 'defaultActions').to.equal(ctx.defaultActions);

      expect($elScope.RDMC.data, 'data').to.be.ok;
      expect($elScope.RDMC.data.repo, 'repo').to.be.ok;
      expect($elScope.RDMC.data.repo, 'repo').to.equal(ctx.repo);
      expect($elScope.RDMC.data.acv, 'acv').to.be.ok;
      expect($elScope.RDMC.data.acv, 'acv').to.equal(ctx.appCodeVersion);
      expect($elScope.RDMC.data.useLatest, 'useLatest').to.be.true;
      expect($elScope.RDMC.data.instance, 'data.instance').to.be.ok;
      expect($elScope.RDMC.data.instance, 'data.instance').to.equal(ctx.instance);

      sinon.assert.calledOnce(ctx.fetchCommitData.activeBranch);
      sinon.assert.calledOnce(ctx.fetchCommitData.activeCommit);

      expect($elScope.RDMC.data.branch, 'branch').to.be.ok;
      expect($elScope.RDMC.data.branch, 'branch').to.equal(ctx.branch);
      expect($elScope.RDMC.data.commit, 'commit').to.be.ok;
      expect($elScope.RDMC.data.commit, 'commit').to.equal(ctx.commit);


      expect($elScope.RDMC.updateInstance, 'updateInstance').to.be.function;
    });

    it('should trigger the update and set the spinner', function () {
      $scope.$digest();
      expect($elScope.RDMC.updateInstance, 'updateInstance').to.be.function;
      $elScope.RDMC.updateInstance();
      sinon.assert.calledWith(ctx.loading, 'main', true);
      $scope.$digest();
      ctx.updateInstanceWithNewAcvDataMock.triggerPromise();
      $scope.$digest();
      sinon.assert.calledWith(ctx.loading, 'main', false);
    });
  });
});
