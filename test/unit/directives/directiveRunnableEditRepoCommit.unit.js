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

var $compile,
    $httpBackend,
    $scope,
    user;

describe('directiveRunnableEditRepoCommit'.bold.underline.blue, function () {
  var ctx = {};

  describe('basic', function () {

    beforeEach(angular.mock.module('app'));

    beforeEach(function () {
      ctx.template = directiveTemplate('runnable-edit-repo-commit', {
        'app-code-version': 'acv'
      });
    });

    beforeEach(function () {
      angular.mock.inject(function (
        _$compile_,
        _$httpBackend_,
        _$rootScope_,
        _user_
      ) {
        $compile = _$compile_;
        $httpBackend = _$httpBackend_;
        $scope = _$rootScope_.$new();
        user = _user_;
      });
      ctx.element = angular.element(ctx.template);
    });

    beforeEach(function () {
      /**
       * API Requests
       * - GET branches
       * - GET commit
       * - GET commitOffset
       * - GET commits
       */

      $httpBackend.resetExpectations();

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
      $scope.acv = ctx.acv;
    });

    beforeEach(function () {
      $compile(ctx.element)($scope);
      $scope.$digest();
      console.log('digest');
      console.log('flush');
      try {
        $httpBackend.flush();
      } catch(e) {
        debugger;
      }
      ctx.$element = jQuery(ctx.element);
    });

    it('loads', function () {
      expect(ctx.$element.is('li.repository-group-item')).to.be.true;
    });

    it('commit author', function () {
      var $el = ctx.$element
        .find('> .commit.load > span.commit-author');
      expect($el).to.be.ok;
      expect($el.html()).to.equal('sipa');
    });

    it('commit time', function () {
      var $el = ctx.$element
        .find('> .commit.load > time.commit-time');
      expect($el).to.be.ok;
      // formatted via timeAgo
      //expect($el.html()).to.equal('15 days ago');
    });

  });
});
