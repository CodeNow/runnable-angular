'use strict';

describe('directiveEditRepoCommit'.bold.underline.blue, function() {
  var apiMocks = require('../apiMocks/index');
  var $compile;
  var $scope;
  var $elScope;
  var ctx;
  var $rootScope;
  var $q;
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
      _$rootScope_,
      _$q_
    ) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $q = _$q_;
    });
    $scope = $rootScope.$new();

    $scope.model = {
      attrs: {
        commit: 'commitSha'
      }
    };
    $scope.instance = ctx.instance = {
      update: sinon.stub()
    };
    ctx.changeCommitSpy = sinon.spy();
    $scope.$on('change-commit', ctx.changeCommitSpy);

    ctx.template = directiveTemplate.attribute('edit-repo-commit', {
      'model': 'model',
      instance: 'instance'
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

  it('should trigger update on change of locked attribute', function () {
    expect($elScope.autoDeploy()).to.not.be.ok;

    $elScope.autoDeploy(true);

    $elScope.$digest();

    sinon.assert.calledOnce(ctx.instance.update);
    sinon.assert.calledWith(ctx.instance.update, {locked: true});
  });

  it('should not allow changing while its already changing the locked attr', function () {
    expect($elScope.autoDeploy()).to.not.be.ok;

    var resolvePromise;
    ctx.instance.update = sinon.stub().returns($q(function (resolve) {
      resolvePromise = resolve;
    }));

    $elScope.autoDeploy(true);

    $elScope.$digest();

    var rtn = $elScope.autoDeploy(false);
    expect(rtn).to.be.ok;

    sinon.assert.calledOnce(ctx.instance.update);
    sinon.assert.calledWith(ctx.instance.update, {locked: true});
  });
});
