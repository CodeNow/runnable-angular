var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
var mocks   = require('../api-mocks');
var directiveTemplate = require('../../fixtures/directiveTemplate');
require('browserify-angular-mocks');

var host = require('../../../client/config/json/api.json').host;

var expect = chai.expect;
var $compile,
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
        _$rootScope_,
        _user_
      ) {
        $compile = _$compile_;
        $scope = _$rootScope_;
        user = _user_;
      });
      ctx.element = angular.element(ctx.template);
    });
    beforeEach(function (done) {
      user.reset(mocks.user);
      ctx.acv = user
        .newContext('contextId')
        .newVersion('versionId')
        .newAppCodeVersion(mocks.acv);

      $scope.acv = ctx.acv;
    });
    beforeEach(function () {
      $compile(ctx.element)($scope);
      $scope.$digest();
    });
    it('should display', function () {

      // verify populated fields are showing after $scope.apply has been called
      // expect(element.child.text).to.equal('hello');
    });
  });
});
