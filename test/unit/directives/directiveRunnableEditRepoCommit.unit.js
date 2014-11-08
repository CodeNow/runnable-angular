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

describe.skip('directiveRunnableEditRepoCommit'.bold.underline.blue, function() {
  var ctx;

  function injectSetupCompile () {
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

    user.reset(mocks.user);
    ctx.acv = user
      .newContext('contextId')
      .newVersion('versionId')
      .newAppCodeVersion(mocks.appCodeVersions.bitcoinAppCodeVersion);

    // unsavedAcv passed to directive from
    // parent directive: runnableRepoList
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
    ctx.$element = jQuery(ctx.element);
    $elScope = ctx.element.isolateScope();
  };

  beforeEach(angular.mock.module('app'));

  beforeEach(function() {
    ctx = {};
    ctx.template = directiveTemplate('runnable-edit-repo-commit', {
      'app-code-version': 'acv',
      'unsaved-app-code-version': 'unsavedAcv'
    });
  });

  describe('has expected scope properties'.blue, function () {
   it('$state.$current.name instance.setup', function() {
      angular.mock.module(function ($provide) {
        $provide.value('$state', {
          '$current': {
            name: 'instance.setup'
          }
        });
      });
      injectSetupCompile();

      // scope properties
      expect($elScope).to.have.property('showEditGearMenu', true);
    });


    it('$state.$current.name instance.instance', function() {
      angular.mock.module(function ($provide) {
        $provide.value('$state', {
          '$current': {
            name: 'instance.instance'
          }
        });
      });
      injectSetupCompile();

      // scope properties
      expect($elScope).to.have.property('showEditGearMenu', false);
    });

   it('$state.$current.name instance.instanceEdit', function() {
      angular.mock.module(function ($provide) {
        $provide.value('$state', {
          '$current': {
            name: 'instance.instanceEdit'
          }
        });
      });
      injectSetupCompile();

      // scope properties
      expect($elScope).to.have.property('showEditGearMenu', true);
    });
  });

  it('displays commit author', function() {
    injectSetupCompile();

    // commit author
    var $el = ctx.$element
      .find('> .commit.load > span.commit-author');
    expect($el.length).to.be.ok;
    expect($el.html()).to.equal('sipa');
  });

  it('displays commit time (through timeAgo filter)', function() {
    injectSetupCompile();

    // commit time
    var $el = ctx.$element
      .find('> .commit.load > time.commit-time');
    expect($el.length).to.be.ok;
    expect($el.html()).to.equal($filter('timeAgo')($elScope.activeCommit.attrs.commit.author.date));
  });
});
