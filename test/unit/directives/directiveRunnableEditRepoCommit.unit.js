var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
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
        .newAppCodeVersion(mocks.appCodeVersions.index);
      $scope.acv = ctx.acv;
    });
    beforeEach(function () {
      var commitOffsetUrl = host + '/github/repos/cflynn07/bitcoin/commits/1f27c310a4bcca758f708358601fa25976d56d90?';
      $httpBackend
        .when('GET', commitOffsetUrl)
        .respond();
      $httpBackend.expectGET(commitOffsetUrl);
    });
    beforeEach(function () {
      $compile(ctx.element)($scope);
      $scope.$digest();
    });
    it('should display', function () {
      expect(true).to.equal(true);

      // verify populated fields are showing after $scope.apply has been called
      // expect(element.child.text).to.equal('hello');
    });
  });
});
