'use strict';

// injector-provided
var $compile,
    $filter,
    $httpBackend,
    $provide,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    user;
var $elScope;

describe('directiveEditRepoCommit'.bold.underline.blue, function() {
  var ctx;

  function injectSetupCompile (state, stateParams) {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('$state', state);

      $provide.value('$stateParams', stateParams);
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
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      $state = _$state_;
      $stateParams = _$stateParams_;
      $scope = _$rootScope_.$new();
      $timeout = _$timeout_;
      user = _user_;
    });

    /**
     * API Requests
     * - GET branches
     * - GET commit
     * - GET commitOffset
     * - GET commits
     */
    var branchesUrl = host + '/github/repos/cflynn07/bitcoin/branches?per_page=100';
    $httpBackend
      .whenGET(branchesUrl)
      .respond(mocks.branches.bitcoinRepoBranches);

    var commitUrl = host + '/github/repos/cflynn07/bitcoin/commits/1f27c310a4bcca758f708358601fa25976d56d90?';
    $httpBackend
      .whenGET(commitUrl)
      .respond(mocks.commit.bitcoinRepoCommit1);

    var commitOffsetUrl = host + '/github/repos/cflynn07/bitcoin/compare/master...1f27c310a4bcca758f708358601fa25976d56d90';
    $httpBackend
      .whenGET(commitOffsetUrl)
      .respond(mocks.commitCompare.zeroBehind);

    var commitsUrl = host + '/github/repos/cflynn07/bitcoin/commits?sha=master&per_page=100';
    $httpBackend
      .whenGET(commitsUrl)
      .respond(mocks.gh.bitcoinRepoCommits);

    var userUrl = host + '/users/me?';
    $httpBackend
      .whenGET(userUrl)
      .respond(mocks.user);

    var instanceUrl = host + '/instances?githubUsername=cflynn07&name=box1';
    $httpBackend
      .whenGET(instanceUrl)
      .respond(mocks.instances.runningWithContainers);

    user.reset(mocks.user);
    ctx.acv = user
      .newContext('contextId')
      .newVersion('versionId')
      .newAppCodeVersion(mocks.appCodeVersions.bitcoinAppCodeVersion);

    // unsavedAcv passed to directive from
    // parent directive: repoList
    ctx.unsavedAcv = user
      .newContext('contextId')
      .newVersion('versionId')
      .newAppCodeVersion(ctx.acv.toJSON());

    $scope.acv = ctx.acv;
    $scope.unsavedAcv = ctx.unsavedAcv;

    modelStore.reset();

    ctx.element = angular.element(ctx.template);
    ctx.element = $compile(ctx.element)($scope);
    $scope.$digest();
    $httpBackend.flush();
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  beforeEach(function() {
    ctx = {};
    ctx.template = directiveTemplate.attribute('edit-repo-commit', {
      'app-code-version': 'acv',
      'unsaved-app-code-version': 'unsavedAcv'
    });
  });

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

  // Currently does not
  it.skip('displays commit author', function() {
    injectSetupCompile({
      '$current': {
        name: 'instance.instanceEdit'
      }
    }, {
      userName: 'cflynn07',
      instanceName: 'box1'
    });

    // commit author
    var $el = ctx.element[0]
      .querySelector('.commit.load > span.commit-author');
    expect($el).to.be.ok;
    expect($el.innerText).to.equal('sipa');
  });

  it('displays commit time (through timeAgo filter)', function() {
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

});
