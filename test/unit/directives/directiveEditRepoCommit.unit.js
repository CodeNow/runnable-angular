'use strict';

// injector-provided
var $compile,
    $provide,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    user;
var $elScope;

var apiMocks = require('../apiMocks/index');

var runnable = new (require('runnable'))('http://example.com/');

describe('directiveEditRepoCommit'.bold.underline.blue, function() {
  var ctx;
  function injectSetupCompile (state, stateParams, nullAcv) {
    ctx = {};
    ctx.branch = {attrs: apiMocks.branches.bitcoinRepoBranches[0]};
    ctx.commit = {attrs: apiMocks.commit.bitcoinRepoCommit1};
    ctx.fetchCommitData = {
      activeBranch: sinon.spy(function (acv) {
        return ctx.branch;
      }),
      activeCommit: sinon.spy(function (acv) {
        return ctx.commit;
      }),
      offset: sinon.spy(),
      branchCommits: sinon.spy()
    };
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchCommitData', function () { return ctx.fetchCommitData; });
      $provide.value('$state', state || {
        '$current': {
          name: 'instance.setup'
        }
      });
      $provide.value('$stateParams', stateParams || {
        userName: 'cflynn07',
        instanceName: 'box1'
      });
    });

    angular.mock.inject(function (
      _$compile_,
      _$rootScope_,
      _$state_,
      _$stateParams_,
      _$timeout_,
      _user_
    ) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $state = _$state_;
      $stateParams = _$stateParams_;
      $scope = _$rootScope_.$new();
      $timeout = _$timeout_;
      user = _user_;
    });
    ctx.acv = user
      .newContext('contextId')
      .newVersion('versionId')
      .newAppCodeVersion(apiMocks.appCodeVersions.bitcoinAppCodeVersion);
    ctx.acv.destroy = sinon.spy(function (cb) {
      cb();
    });

    // unsavedAcv passed to directive from
    // parent directive: repoList
    ctx.unsavedAcv = angular.copy(ctx.acv.attrs);
    delete ctx.unsavedAcv.id;
    delete ctx.unsavedAcv._id;

    ctx.model = {
      acv: ctx.acv,
      unsavedAcv: ctx.unsavedAcv
    };

    $scope.model = nullAcv ? null : ctx.model;

    ctx.template = directiveTemplate.attribute('edit-repo-commit', {
      'model': 'model'
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  var json_branches = eval(apiMocks.branches.bitcoinRepoBranches);

  describe('has expected scope properties'.blue, function () {

   it('$state.$current.name instance.setup', function() {
      injectSetupCompile({
        '$current': {
          name: 'instance.setup'
        }
      }, {
        userName: 'cflynn07',
        instanceName: 'box1'
      });

      // scope properties
     expect($elScope.popoverRepositoryToggle).to.have.property('data');
     expect($elScope.popoverRepositoryToggle.data).to.have.property('acv', ctx.acv);
     expect($elScope.popoverRepositoryToggle.data).to.have.property('unsavedAcv', ctx.unsavedAcv);

     expect($elScope.popoverRepositoryToggle).to.have.property('actions');
     expect($elScope.popoverRepositoryToggle.actions.selectBranch).to.be.okay;
     expect($elScope.popoverRepositoryToggle.actions.selectCommit).to.be.okay;


     expect($elScope).to.have.property('popoverRepoActions');
     expect($elScope.popoverRepoActions).to.have.property('data');
     expect($elScope.popoverRepoActions.data).to.have.property('acv', ctx.acv);
     expect($elScope.popoverRepoActions.data).to.have.property('unsavedAcv', ctx.unsavedAcv);

     expect($elScope.popoverRepoActions).to.have.property('actions');
     expect($elScope.popoverRepoActions.actions.deleteRepo).to.be.okay;
    });

    it('$state.$current.name instance.instance', function() {
      injectSetupCompile({
        '$current': {
          name: 'instance.instance'
        }
      }, {
        userName: 'cflynn07',
        instanceName: 'box1'
      });
    });

    it('$state.$current.name instance.instanceEdit', function() {
      injectSetupCompile({
        '$current': {
          name: 'instance.instanceEdit'
        }
      }, {
        userName: 'cflynn07',
        instanceName: 'box1'
      });

    });
  });

  describe('Startup'.blue, function () {
    it('should use the current branch and commit from the acv', function () {
      injectSetupCompile({
        '$current': {
          name: 'instance.instanceEdit'
        }
      }, {
        userName: 'cflynn07',
        instanceName: 'box1'
      });

      // Grab the branch
      var $parentElement = ctx.element[0]
        .querySelector('.repository-group-text');
      expect($parentElement).to.be.ok;
      // var $children = $parentElement.children;
      sinon.assert.calledWith(ctx.fetchCommitData.activeBranch, ctx.acv);
      sinon.assert.calledWith(ctx.fetchCommitData.activeCommit, ctx.acv);
    });

    it('should use the current branch and commit from a null acv', function () {
      injectSetupCompile({
        '$current': {
          name: 'instance.instanceEdit'
        }
      }, {
        userName: 'cflynn07',
        instanceName: 'box1'
      }, true);

      // Grab the branch
      var $parentElement = ctx.element[0]
        .querySelector('.repository-group-text');
      expect($parentElement).to.be.ok;
      var $children = $parentElement.children;

      expect($children[2].innerText).to.equal('');

      $scope.model = ctx.model;
      $scope.$apply();

      expect($children[2].innerText).to.match(/Merge pull request #5080\n\ne21b\d+ months ago/);
    });
  });

  describe('Responds to user interactions correctly'.blue, function () {
    it('should trigger events on the popover show', function () {
      injectSetupCompile({
        '$current': {
          name: 'instance.setup'
        }
      }, {
        userName: 'cflynn07'
      });
      ctx.fetchCommitData.activeBranch.reset();
      sinon.assert.neverCalledWith(ctx.fetchCommitData.activeBranch, ctx.acv, ctx.acv.attrs.branch);
      $elScope.popoverRepositoryToggle.data.show = true;
      $scope.$apply();

      $elScope.popoverRepositoryToggle.data.show = false;
      $scope.$apply();

      sinon.assert.calledWith(ctx.fetchCommitData.activeBranch, ctx.acv, ctx.acv.attrs.branch);
    });
    it('should delete repo on action event', function () {
      injectSetupCompile({
        '$current': {
          name: 'instance.setup'
        }
      }, {
        userName: 'cflynn07'
      });

      $elScope.popoverRepositoryToggle.actions.deleteRepo();
      sinon.assert.calledOnce(ctx.acv.destroy);
    });
    describe('Branch changes'.blue, function () {
      it('should set the activeBranch, fetch the commits', function () {
        injectSetupCompile({
          '$current': {
            name: 'instance.setup'
          }
        }, {
          userName: 'cflynn07'
        });

        expect($elScope.activeBranch).to.equal(ctx.branch);

        var branch = {attrs: apiMocks.branches.bitcoinRepoBranches[1]};
        ctx.fetchCommitData.activeBranch = sinon.spy(function () {
          return branch;
        });

        $elScope.popoverRepositoryToggle.actions.selectBranch(branch);
        $scope.$apply();

        expect($elScope.activeBranch).to.deep.equal(branch);

        sinon.assert.calledWith(ctx.fetchCommitData.branchCommits, branch);

        // Grab the branch
        var $parentElement = ctx.element[0]
          .querySelector('.repository-group-text');
        expect($parentElement).to.be.ok;
        var $children = $parentElement.children;
        expect($children[2].innerText).to.match(/Merge pull request #5080\n\ne21b\d+ months ago/);
      });

      it('should set the activeCommmit, change the branch and commit for the unsaved', function () {
        injectSetupCompile({
          '$current': {
            name: 'instance.setup'
          }
        }, {
          userName: 'cflynn07'
        });

        expect($elScope.activeBranch).to.equal(ctx.branch);
        expect($elScope.activeCommit).to.equal(ctx.commit);

        var branch = {attrs: apiMocks.branches.bitcoinRepoBranches[1]};
        var commit = {attrs: apiMocks.commit.bitcoinRepoCommit2};
        ctx.fetchCommitData.activeBranch = sinon.spy(function () {
          return branch;
        });
        ctx.fetchCommitData.activeCommit = sinon.spy(function () {
          return commit;
        });
        var scopeListenerSpy = sinon.spy();
        $scope.$on('acv-change', scopeListenerSpy);

        $elScope.popoverRepositoryToggle.actions.selectBranch(branch);
        $elScope.popoverRepositoryToggle.actions.selectCommit(commit.attrs.sha);
        $scope.$apply();

        expect($elScope.activeBranch).to.deep.equal(branch);
        expect($elScope.activeCommit).to.deep.equal(commit);

        expect($elScope.popoverRepositoryToggle.data.show).to.be.false;
        expect(ctx.unsavedAcv.branch).to.equal(branch.attrs.name);
        expect(ctx.unsavedAcv.commit).to.equal(commit.attrs.sha);
        sinon.assert.calledWith(ctx.fetchCommitData.activeCommit, ctx.acv, commit.attrs.sha);

        sinon.assert.calledOnce(scopeListenerSpy);
        // Grab the branch
        var $parentElement = ctx.element[0]
          .querySelector('.repository-group-text');
        expect($parentElement).to.be.ok;
        var $children = $parentElement.children;
        expect($children[2].innerText).to.match(/\d\.\d\.\d+ months ago/);
      });
    });
  });

});
