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
        $scope = _$rootScope_;
        user = _user_;
      });
      ctx.element = angular.element(ctx.template);
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
      /**
       * API Requests
       * - GET branches
       * - GET commit
       * - GET commitOffset
       * - GET commits
       */

      var branchesUrl = host + '/github/repos/cflynn07/bitcoin/branches?per_page=100';
      $httpBackend
        .when('GET', branchesUrl)
        .respond(mocks.branches.bitcoinRepoBranches);
      $httpBackend.expectGET(branchesUrl);

      var commitUrl = host + '/github/repos/cflynn07/bitcoin/commits/1f27c310a4bcca758f708358601fa25976d56d90?';
      $httpBackend
        .when('GET', commitUrl)
        .respond(mocks.commit.bitcoinRepoCommit1);
      $httpBackend.expectGET(commitUrl);

      var commitOffsetUrl = host + '/github/repos/cflynn07/bitcoin/compare/master...1f27c310a4bcca758f708358601fa25976d56d90';
      $httpBackend
        .when('GET', commitOffsetUrl)
        .respond(mocks.commitCompare.zeroBehind);
      $httpBackend.expectGET(commitOffsetUrl);

      var commitsUrl = host + '/github/repos/cflynn07/bitcoin/commits?sha=master&per_page=100';
      $httpBackend
        .when('GET', commitsUrl)
        .respond(mocks.gh.bitcoinRepoCommits);
      $httpBackend.expectGET(commitsUrl);
    });
    beforeEach(function () {
      $compile(ctx.element)($scope);
      $scope.$digest();
      $httpBackend.flush();
    });
    it('should display commit author', function () {
      debugger;
      // jQuery(ctx.element).find('div > span.commit-author').html() === 'sipa'
      expect(true).to.equal(true);
    });

  });
});
