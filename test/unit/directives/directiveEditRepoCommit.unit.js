'use strict';

describe('directiveEditRepoCommit'.bold.underline.blue, function() {
  var apiMocks = require('../apiMocks/index');
  var $compile;
  var $scope;
  var $elScope;
  var ctx;
  var $rootScope;
  function setup() {
    ctx = {};
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
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchCommitData', function () { return ctx.fetchCommitData; });
    });

    angular.mock.inject(function (
      _$compile_,
      _$rootScope_
    ) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
    });
    $scope = $rootScope.$new();

    $scope.model = {
      attrs: {
        commit: 'commitSha'
      }
    };
    ctx.changeCommitSpy = sinon.spy();
    $scope.$on('change-commit', ctx.changeCommitSpy);

    ctx.template = directiveTemplate.attribute('edit-repo-commit', {
      'model': 'model'
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  beforeEach(function () {
    setup();
  });

  it('should fetch the active commit', function () {
    expect($elScope.activeCommit).to.equal(ctx.commit);
    sinon.assert.calledOnce(ctx.fetchCommitData.activeCommit);
  });

  describe('actions', function () {
    it('toggleEditCommits should setup popoverRepositoryToggle data', function () {
      $elScope.actions.toggleEditCommits();
      sinon.assert.calledOnce(ctx.fetchCommitData.branchCommits);
      expect($elScope.popoverRepositoryToggle.data.branch).to.equal(ctx.branch);
      expect($elScope.popoverRepositoryToggle.data.commit).to.equal(ctx.commit);
    });

    it('popoverRepositoryToggle.selectCommit should emit an update event and update the current ACV', function () {
      var sha = 'myCommitSha1234';
      $elScope.popoverRepositoryToggle.actions.selectCommit(sha);

      sinon.assert.calledOnce(ctx.changeCommitSpy);
      expect(ctx.changeCommitSpy.lastCall.args[1]).to.equal(sha);

      expect($scope.model.attrs.commit).to.equal(sha);
    });
  });
});
