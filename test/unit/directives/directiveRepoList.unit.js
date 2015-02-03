'use strict';

describe('directiveRepoList'.bold.underline.blue, function () {
  var element;
  var $scope;
  var $rootScope;
  var thisUser;
  var $q;
  var ctx = {};

  function initGlobalState(provideValues) {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('$state', provideValues.state);

      $provide.value('$stateParams', provideValues.stateParams);
      $provide.factory('fetchInstances', fixtures.mockFetchInstances.running);
      $provide.factory('fetchBuild', fixtures.MockFetchBuild.setup);
      $provide.factory('pFetchUser', fixtures.mockFetchUser);
    });
    angular.mock.inject(function($compile, _$rootScope_, $timeout, user){
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      thisUser = user;
      thisUser.reset(mocks.user);

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
