var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
var jQuery  = require('jquery');
var mocks   = require('../apiMocks');
var expect  = chai.expect;
var directiveTemplate = require('../../fixtures/directiveTemplate');
var host = require('../../../client/config/json/api.json').host;
require('browserify-angular-mocks');

// injector-provided
var $compile,
    $filter,
    $httpBackend,
    $rootScope,
    $scope,
    user;

var $elScope;

describe('directiveRunnableEditRepoCommit'.bold.underline.blue, function () {
  var ctx = {};

  beforeEach(angular.mock.module('app'));

  beforeEach(function () {
    ctx.template = directiveTemplate('runnable-edit-repo-commit', {
      'app-code-version': 'acv',
      'unsaved-app-code-version': 'unsavedAcv'
    });
  });

  beforeEach(function () {
    angular.mock.inject(function (
      _$compile_,
      _$filter_,
      _$httpBackend_,
      _$rootScope_,
      _user_
    ) {
      $compile = _$compile_;
      $filter = _$filter_;
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      user = _user_;
    });
  });

  beforeEach(function () {
    /**
     * API Requests
     * - GET branches
     * - GET commit
     * - GET commitOffset
     * - GET commits
     */

    var branchesUrl = host + '/github/repos/cflynn07/bitcoin/branches?per_page=100';
    $httpBackend
      .expectGET(branchesUrl)
      .respond(mocks.branches.bitcoinRepoBranches);

    var commitUrl = host + '/github/repos/cflynn07/bitcoin/commits/1f27c310a4bcca758f708358601fa25976d56d90?';
    $httpBackend
      .expectGET(commitUrl)
      .respond(mocks.commit.bitcoinRepoCommit1);

    var commitOffsetUrl = host + '/github/repos/cflynn07/bitcoin/compare/master...1f27c310a4bcca758f708358601fa25976d56d90';
    $httpBackend
      .expectGET(commitOffsetUrl)
      .respond(mocks.commitCompare.zeroBehind);

    var commitsUrl = host + '/github/repos/cflynn07/bitcoin/commits?sha=master&per_page=100';
    $httpBackend
      .expectGET(commitsUrl)
      .respond(mocks.gh.bitcoinRepoCommits);
  });

  beforeEach(function () {
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
  });

  beforeEach(function () {
    ctx.element = angular.element(ctx.template);
    $compile(ctx.element)($scope);
    $scope.$digest();
    $httpBackend.flush();
    ctx.$element = jQuery(ctx.element);
    $elScope = angular.element(ctx.$element.find(':first')).scope();
  });

  it('basic', function () {
    // scope properties
    console.log('scope properties');
    expect($elScope).to.have.property('acv');
    expect($elScope).to.have.property('unsavedAcv');
    expect($elScope).to.have.property('activeBranch');
    expect($elScope).to.have.property('activeCommit');

    // commit author
    console.log('commit author');
    var $el = ctx.$element
      .find('> .commit.load > span.commit-author');
    expect($el).to.be.ok;
    expect($el.html()).to.equal('sipa');

    // commit time
    console.log('commit time');
    $el = ctx.$element
      .find('> .commit.load > time.commit-time');
    expect($el).to.be.ok;
    expect($el.html()).to.equal($filter('timeAgo')($elScope.activeCommit.attrs.commit.author.date));
  });

});
