'use strict';

// injector-provided
var $compile,
    $filter,
    $provide,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    user;
var $elScope;

var apiMocks = require('../apiMocks/index');

var mockFetch = require('../fixtures/mockFetch');
var runnable = new (require('runnable'))('http://example.com/');

describe('directiveEditRepoCommit'.bold.underline.blue, function() {
  var ctx;
  var json_commit = eval(apiMocks.commit.bitcoinRepoCommit1);
  var json_branches = eval(apiMocks.branches.bitcoinRepoBranches);

  function injectSetupCompile (state, stateParams) {
    ctx = {};
    ctx.fetchCommitData = {
      activeBranch: sinon.spy(function (acv) {
        return {attrs: apiMocks.branches.bitcoinRepoBranches[0]};
      }),
      activeCommit: sinon.spy(function (acv) {
        return {attrs: apiMocks.commit.bitcoinRepoCommit1};
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
      _$filter_,
      _$httpBackend_,
      _$rootScope_,
      _$state_,
      _$stateParams_,
      _$timeout_,
      _user_
    ) {
      $compile = _$compile_;
      $filter = _$filter_;
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

    // unsavedAcv passed to directive from
    // parent directive: repoList
    ctx.unsavedAcv = user
      .newContext('contextId')
      .newVersion('versionId')
      .newAppCodeVersion(ctx.acv.toJSON());

    $scope.acv = ctx.acv;
    $scope.unsavedAcv = ctx.unsavedAcv;

    ctx.template = directiveTemplate.attribute('edit-repo-commit', {
      'app-code-version': 'acv',
      'unsaved-app-code-version': 'unsavedAcv'
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

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
     expect($elScope).to.have.property('showEditGearMenu', true);
     expect($elScope.popoverRepositoryToggle).to.have.property('data');
     expect($elScope.popoverRepositoryToggle.data).to.have.property('acv', ctx.acv);
     expect($elScope.popoverRepositoryToggle.data).to.have.property('unsavedAcv', ctx.unsavedAcv);
     expect($elScope.popoverRepositoryToggle.data).to.have.property('toggleFilter', false);
     expect($elScope.popoverRepositoryToggle.data).to.have.property('commitFilter', '');

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

      // scope properties
      expect($elScope).to.have.property('showEditGearMenu', false);
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

      // scope properties
      expect($elScope).to.have.property('showEditGearMenu', true);
    });
  });

  it.skip('displays commit time (through timeAgo filter)', function() {
    injectSetupCompile({
      '$current': {
        name: 'instance.instanceEdit'
      }
    }, {
      userName: 'cflynn07',
      instanceName: 'box1'
    });

    // commit time
    var $el = ctx.element[0]
      .querySelector('small.repository-detail');
    expect($el).to.be.ok;
    expect($el.innerText).to.match(/\d+ months ago/);
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
      var $children = $parentElement.children;
      sinon.assert.calledWith(ctx.fetchCommitData.activeBranch, ctx.acv);
      sinon.assert.calledWith(ctx.fetchCommitData.activeCommit, ctx.acv);

      expect($children[2].innerText).to.equal(json_branches[0].name);
      expect($children[3].childNodes[1].data).to.equal(json_commit.commit.message);
      expect($children[3].childNodes[2].innerText).to.match(/\d+ months ago/);
    });
  });

  describe('Responds to user interactions correctly'.blue, function () {

    describe('Branch changes'.blue, function () {
      it('should set the activeBranch, fetch the commits, and set the activeCommit', function () {
        injectSetupCompile({
          '$current': {
            name: 'instance.setup'
          }
        }, {
          userName: 'cflynn07'
        });

      });
    });
  });

});
