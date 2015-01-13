'use strict';

describe('directiveRepoList'.bold.underline.blue, function () {
  var element;
  var $scope;
  var $rootScope;
  var $httpBackend;
  var thisUser;
  var ctx = {};

  function initGlobalState(provideValues) {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('$state', provideValues.state);

      $provide.value('$stateParams', provideValues.stateParams);
    });
    angular.mock.inject(function($compile, _$rootScope_, $timeout, _$httpBackend_, user){
      $rootScope = _$rootScope_;
      $httpBackend = _$httpBackend_;
      $scope = $rootScope.$new();
      thisUser = user;
      thisUser.reset(mocks.user);

      // Using whenGET here and elsewhere because it's indeterminate as to which will fire first
      var userUrl = host + '/users/me?';
      $httpBackend
        .whenGET(userUrl)
        .respond(mocks.user);
      $httpBackend.whenGET(host + '/github/user/repos?page=1&sort=updated&type=owner&per_page=100')
        .respond(mocks.gh.repos);

      $rootScope.dataApp = {
        user: thisUser,
        data: {},
        stateParams: {}
      };
    });
    modelStore.reset();
  }

  describe('build only'.bold.blue, function () {
    function initState() {
      angular.mock.inject(function($compile) {
        var buildUrl = host + '/builds/54668070531ae50e002c8503?';
        $httpBackend
          .whenGET(buildUrl)
          .respond(mocks.builds.setup);
        $httpBackend.whenGET(host + '/contexts/54398933f5afb6410069bc33/versions/54398934f5afb6410069bc34?')
        .respond(mocks.contextVersions.setup);

        var tpl = directiveTemplate.attribute('repo-list', {
          'unsaved-acvs': 'unsavedAcvs'
        });
        $scope.unsavedAcvs = [];

        element = $compile(tpl)($scope);
        $scope.$digest();
      });
    }
    beforeEach(function () {
      initGlobalState({
        state: {
          '$current': {
            name: 'instance.setup'
          }
        },
        stateParams: {
          userName: 'SomeKittens',
          buildId: '54668070531ae50e002c8503'
        }
      });
    });
    beforeEach(initState);
    beforeEach(function() {
      $httpBackend.flush();
      $rootScope.$digest();
    });

    it('should show guide', function() {
      expect(element[0].querySelector('.guide')).to.be.ok;
    });

    it('should show plus', function() {
      expect(element[0].querySelector('.icons-add')).to.be.ok;
    });
  });

  describe('running instance with repo'.bold.blue, function() {
    function initState() {
      angular.mock.inject(function($compile) {
        var instanceUrl = host + '/instances?githubUsername=SomeKittens&name=spaaace';
        $httpBackend
          .whenGET(instanceUrl)
          .respond(mocks.instances.running);
        var commitsUrl = host + '/github/repos/SomeKittens/SPACESHIPS/commits/440d4075e71c01734118d312fc3e3cd6c326f711?';
        $httpBackend
          .whenGET(commitsUrl)
          .respond(mocks.gh.commits);
        var compareUrl = host + '/github/repos/SomeKittens/SPACESHIPS/compare/master...440d4075e71c01734118d312fc3e3cd6c326f711';
        $httpBackend
          .whenGET(compareUrl)
          .respond(mocks.gh.compare);

        var tpl = directiveTemplate.attribute('repo-list', {
          'unsaved-acvs': 'unsavedAcvs'
        });
        $scope.unsavedAcvs = [];

        element = $compile(tpl)($scope);
        $scope.$digest();
      });
    }
    beforeEach(function () {
      initGlobalState({
        state: {
          '$current': {
            name: 'instance.instance'
          }
        },
        stateParams: {
          userName: 'SomeKittens',
          instanceName: 'spaaace'
        }
      });
    });
    beforeEach(initState);
    beforeEach(function() {
      // $httpBackend.flush();
      $rootScope.$digest();
    });

    it('should not display the guide', function() {
      expect(element.find('.guide').length).to.not.be.ok;
    });

    it('should not show plus', function() {
      expect(element[0].querySelector('.icons-add')).to.not.be.ok;
    });
  });

  describe('editing instance with repo'.bold.blue, function() {
    function initState() {
      angular.mock.inject(function($compile) {
        var buildUrl = host + '/builds/543988508f75990e008d2c76?';
        $httpBackend
          .whenGET(buildUrl)
          .respond(mocks.builds.built);
        var commitsUrl = host + '/github/repos/SomeKittens/SPACESHIPS/commits/440d4075e71c01734118d312fc3e3cd6c326f711?';
        $httpBackend
          .whenGET(commitsUrl)
          .respond(mocks.gh.commits);
        var compareUrl = host + '/github/repos/SomeKittens/SPACESHIPS/compare/master...440d4075e71c01734118d312fc3e3cd6c326f711';
        $httpBackend
          .whenGET(compareUrl)
          .respond(mocks.gh.compare);

        var tpl = directiveTemplate.attribute('repo-list', {
          'unsaved-acvs': 'unsavedAcvs'
        });
        $scope.unsavedAcvs = [];

        element = $compile(tpl)($scope);
        $scope.$digest();
      });
    }
    beforeEach(function () {
      initGlobalState({
        state: {
          '$current': {
            name: 'instance.instanceEdit'
          }
        },
        stateParams: {
          userName: 'SomeKittens',
          instanceName: 'spaaace',
          buildId: mocks.builds.built._id
        }
      });
    });
    beforeEach(initState);
    beforeEach(function() {
      // $httpBackend.flush();
      $rootScope.$digest();
    });

    it('should not display the guide', function() {
      expect(element.find('.guide').length).to.not.be.ok;
    });

    it('should show plus', function() {
      expect(element[0].querySelector('.icons-add')).to.be.ok;
    });
  });
});
