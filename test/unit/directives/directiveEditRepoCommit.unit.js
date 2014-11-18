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

  function injectSetupCompile (pageState) {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('$state', {
        '$current': {
          name: 'instance.' + pageState
        }
      });

      $provide.value('$stateParams', {
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

    ctx = {};
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
  };

  beforeEach(angular.mock.module('app'));

  beforeEach(function() {
    ctx = {};
    ctx.template = directiveTemplate('edit-repo-commit', {
      'app-code-version': 'acv',
      'unsaved-app-code-version': 'unsavedAcv'
    });

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $httpBackend.flush();
    $elScope = ctx.element.isolateScope();
  };

  describe('has expected scope properties'.blue, function () {

    it('$state.$current.name instance.setup', function() {
      injectSetupCompile('setup');

      // scope properties
      expect($elScope).to.have.property('showEditGearMenu', true);
    });

    it('$state.$current.name instance.instance', function() {
      injectSetupCompile('instance');

      // scope properties
      expect($elScope).to.have.property('showEditGearMenu', false);
    });

    it('$state.$current.name instance.instanceEdit', function() {
      injectSetupCompile('instanceEdit');

      // scope properties
      expect($elScope).to.have.property('showEditGearMenu', true);
    });

  });

  it('displays commit author', function() {
    injectSetupCompile('instanceEdit');

    // commit author
    var $el = ctx.element[0]
      .querySelector('.commit.load > span.commit-author');
    expect($el).to.be.ok;
    expect($el.innerText).to.equal('sipa');
  });

  it('displays commit time (through timeAgo filter)', function() {
    injectSetupCompile('instanceEdit');

    // commit time
    var $el = ctx.element[0]
      .querySelector('.commit.load > time.commit-time');
    expect($el).to.be.ok;
    expect($el.innerText).to.equal('a month ago');
  });

});
