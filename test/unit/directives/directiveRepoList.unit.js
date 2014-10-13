var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
var modelStore = require('runnable/lib/stores/model-store');
var mocks = require('../api-mocks');
var userJSON = require('../api-mocks/user');
require('browserify-angular-mocks');

var expect = chai.expect;

describe('directiveRepoList'.bold.underline.blue, function () {
  var element;
  var $scope;
  var $rootScope;
  var $httpBackend;
  var thisUser;
  var ctx = {};
  function initGlobalState() {
    angular.mock.module('app');
    angular.mock.inject(function($compile, _$rootScope_, $timeout, _$httpBackend_, user, _jQuery_){
      jQuery = _jQuery_;
      $rootScope = _$rootScope_;
      $httpBackend = _$httpBackend_;
      $scope = $rootScope.$new();
      thisUser = user;
      thisUser.reset(userJSON);

      $rootScope.dataApp = {
        user: thisUser,
        data: {},
        stateParams: {}
      };
      $rootScope.safeApply = function(cb) {
        $timeout(function() {
          $scope.$apply();
        });
      };
    });
  }
  beforeEach(initGlobalState);

  describe('running instance with repo'.bold.blue, function() {
    function initState() {
      angular.mock.inject(function($compile) {
        // Using wheGET for these first two because it's indeterminate as to which will fire first
        $httpBackend.whenGET('http://mewl10-3030.runnable.io/github/user/repos?page=1&sort=updated&type=owner&per_page=100')
        .respond(mocks.gh.repos);
        $httpBackend.whenGET('http://mewl10-3030.runnable.io/contexts/543861deaebe190e0077c24b/versions/543988508f75990e008d2c74?')
        .respond(mocks.contextVersion.running);
        $httpBackend.expectGET('http://mewl10-3030.runnable.io/github/repos/SomeKittens/SPACESHIPS/commits/440d4075e71c01734118d312fc3e3cd6c326f711?')
        .respond(mocks.gh.commits);
        $httpBackend.expectGET('http://mewl10-3030.runnable.io/github/repos/SomeKittens/SPACESHIPS/compare/master...440d4075e71c01734118d312fc3e3cd6c326f711')
        .respond(mocks.gh.commits);

        ctx.instance = thisUser.newInstance(mocks.instance.running);
        $scope.instance = ctx.instance;
        $scope.build = ctx.instance.build;
        $scope.edit = false;
        $scope.showGuide = false;

        element = angular.element('<repo-list ' +
          'instance="instance" ' +
          'build="build" ' +
          'edit="edit" ' +
          'showGuide="showGuide"' +
          '></repo-list>'
        );

        $compile(element)($scope);
        $scope.$apply();
      });
    }
    beforeEach(function () {
      modelStore.reset();
    });
    beforeEach(initState);
    beforeEach(function() {
      $httpBackend.flush();
    });

    it('should create the element', function () {
      expect(element[0].classList.contains('row')).to.be.ok;
      expect(ctx.instance).to.be.ok;
      expect(ctx.instance.build).to.be.ok;
    });

    it('should not display the guide', function() {
      $rootScope.$apply();
      expect(jQuery(element).find('.guide').length).to.not.be.ok;
    });
  });
});
