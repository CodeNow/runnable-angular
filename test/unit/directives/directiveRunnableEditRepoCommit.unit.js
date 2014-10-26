var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
var mocks   = require('../api-mocks');
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
    /*
    beforeEach(function (done) {
      var acvUrl = host + '/' + ctx.acv.path();
      $httpBackend
        .when('GET', acvUrl)
        .respond(mocks.appCodeVersions.index);
      $httpBackend.expectGET(acvUrl);
      debugger;
      ctx.acv.fetch(function () {
        console.log(arguments);
        console.log(ctx.acv.attrs);
        done();
      });
    });
    */
    beforeEach(function () {
      $compile(ctx.element)($scope);
      debugger;
      $scope.$digest();
    });
    it('should display', function () {

      // verify populated fields are showing after $scope.apply has been called
      // expect(element.child.text).to.equal('hello');
    });
  });
});
