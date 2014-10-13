var main    = require('main');
var chai    = require('chai');
var sinon   = require('sinon');
var colors  = require('colors');
var angular = require('angular');
var modelStore = require('runnable/lib/stores/model-store');
var mocks = require('../api-mocks');
require('browserify-angular-mocks');

var host = require('../../../client/config/json/api.json').host;

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
    angular.mock.inject(function($compile, _$rootScope_, $timeout, _$httpBackend_, user){
      $rootScope = _$rootScope_;
      $httpBackend = _$httpBackend_;
      $scope = $rootScope.$new();
      thisUser = user;
      thisUser.reset(mocks.user);

      // Using whenGET here and elsewhere because it's indeterminate as to which will fire first
      $httpBackend.whenGET(host + '/github/user/repos?page=1&sort=updated&type=owner&per_page=100')
        .respond(mocks.gh.repos);

      $rootScope.dataApp = {
        user: thisUser,
        data: {},
        stateParams: {}
      };
      $rootScope.safeApply = function(cb) {
        $timeout(function() {
          $scope.$digest();
        });
      };
    });
    modelStore.reset();
  }
  beforeEach(initGlobalState);

  describe('build only'.bold.blue, function () {
    function initState() {
      angular.mock.inject(function($compile) {
        $httpBackend.whenGET(host + '/contexts/54398933f5afb6410069bc33/versions/54398934f5afb6410069bc34?')
        .respond(mocks.contextVersions.setup);

        $scope.build = thisUser.newBuild(mocks.builds.setup);
        $scope.edit = true;
        $scope.showGuide = true;

        var tpl = '<repo-list ' +
          'build="build" ' +
          'edit="edit" ' +
          'show-guide="showGuide"' +
          '></repo-list>';

        element = $compile(tpl)($scope);
        $scope.$digest();
      });
    }
    beforeEach(initState);
    beforeEach(function() {
      $httpBackend.flush();
      $rootScope.$digest();
    });

    it('should create the element', function () {
      expect(element[0].classList.contains('row')).to.be.ok;
    });

    it('should show guide', function() {
      expect(element[0].querySelector('.guide')).to.be.ok;
    });

    it('should show plus', function() {
      expect(element[0].querySelector('.icons-add'));
    });
  });

  describe('running instance with repo'.bold.blue, function() {
    function initState() {
      angular.mock.inject(function($compile) {
        $httpBackend.whenGET(host + '/contexts/543861deaebe190e0077c24b/versions/543988508f75990e008d2c74?')
        .respond(mocks.contextVersions.running);
        $httpBackend.expectGET(host + '/github/repos/SomeKittens/SPACESHIPS/commits/440d4075e71c01734118d312fc3e3cd6c326f711?')
        .respond(mocks.gh.commits);
        $httpBackend.expectGET(host + '/github/repos/SomeKittens/SPACESHIPS/compare/master...440d4075e71c01734118d312fc3e3cd6c326f711')
        .respond(mocks.gh.compare);

        ctx.instance = thisUser.newInstance(mocks.instances.running);
        $scope.instance = ctx.instance;
        $scope.build = ctx.instance.build;
        $scope.edit = false;
        $scope.showGuide = false;

        var tpl = '<repo-list ' +
          'instance="instance" ' +
          'build="build" ' +
          'edit="edit" ' +
          'show-guide="showGuide"' +
          '></repo-list>';

        element = $compile(tpl)($scope);
        $scope.$digest();
      });
    }
    beforeEach(initState);
    beforeEach(function() {
      $httpBackend.flush();
      $rootScope.$digest();
    });

    it('should create the element', function () {
      expect(element[0].classList.contains('row')).to.be.ok;
    });

    it('should not display the guide', function() {
      expect(element.find('.guide').length).to.not.be.ok;
    });

    it('should not show plus', function() {
      expect(element[0].querySelector('.icons-add'));
    });
  });

  describe('editing instance with repo'.bold.blue, function() {
    function initState() {
      angular.mock.inject(function($compile) {
        $httpBackend.whenGET(host + '/contexts/543861deaebe190e0077c24b/versions/543988508f75990e008d2c74?')
        .respond(mocks.contextVersions.running);
        $httpBackend.expectGET(host + '/github/repos/SomeKittens/SPACESHIPS/commits/440d4075e71c01734118d312fc3e3cd6c326f711?')
        .respond(mocks.gh.commits);
        $httpBackend.expectGET(host + '/github/repos/SomeKittens/SPACESHIPS/compare/master...440d4075e71c01734118d312fc3e3cd6c326f711')
        .respond(mocks.gh.compare);

        ctx.instance = thisUser.newInstance(mocks.instances.running);
        $scope.instance = ctx.instance;
        $scope.build = ctx.instance.build;
        $scope.edit = true;
        $scope.showGuide = false;

        var tpl = '<repo-list ' +
          'instance="instance" ' +
          'build="build" ' +
          'edit="edit" ' +
          'show-guide="showGuide"' +
          '></repo-list>';

        element = $compile(tpl)($scope);
        $scope.$digest();
      });
    }
    beforeEach(initState);
    beforeEach(function() {
      $httpBackend.flush();
      $rootScope.$digest();
    });

    it('should create the element', function () {
      expect(element[0].classList.contains('row')).to.be.ok;
    });

    it('should not display the guide', function() {
      expect(element.find('.guide').length).to.not.be.ok;
    });

    it('should not show plus', function() {
      expect(element[0].querySelector('.icons-add'));
    });
  });
});
