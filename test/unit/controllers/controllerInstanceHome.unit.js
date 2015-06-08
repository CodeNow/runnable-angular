'use strict';

var $controller,
    $rootScope,
    $timeout,
    $scope,
    $localStorage,
    keypather,
    $state,
    $q;
var apiMocks = require('../apiMocks/index');
var mockFetch = new (require('../fixtures/mockFetch'))();
var mockFetchUser = require('../fixtures/mockFetchUser');
/**
 * Things to test:
 * Since this controller is pretty simple, we only need to test it's redirection
 */
describe('ControllerInstanceHome'.bold.underline.blue, function () {
  var ctx = {};
  function setup(activeAccountUsername, localStorageData) {
    mockFetch.clearDeferer();
    angular.mock.module('app');
    ctx.fakeuser = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'user';
      }
    };
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      }
    };
    ctx.fakeOrg2 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org2';
      }
    };

    ctx.userList = {
      user: ctx.fakeuser,
      org1: ctx.fakeOrg1,
      org2: ctx.fakeOrg2
    };

    ctx.instanceLists = {
      user: {
        models: [{
          attrs: angular.copy(apiMocks.instances.running)
        }, {
          attrs: angular.copy(apiMocks.instances.stopped)
        }]
      },
      org1: {
        models: [{
          attrs: angular.copy(apiMocks.instances.building)
        }]
      },
      org2: {
        models: []
      }
    };
    ctx.setupInstanceResponse = function(username, cb) {
      return function (overrideUsername) {
        cb(null, ctx.instanceLists[overrideUsername || username], overrideUsername || username);
      };
    };
    ctx.stateParams = {
      userName: activeAccountUsername || 'user'
    };
    angular.mock.module('app', function ($provide) {
      $provide.factory('fetchUser', mockFetchUser);
      $provide.factory('fetchInstancesByPod', mockFetch.fetch());
      $provide.value('favico', {
        reset : sinon.spy(),
        setInstanceState: sinon.spy()
      });
      $provide.value('$stateParams', ctx.stateParams);
      $provide.value('$localStorage', localStorageData || {});
    });
    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _$localStorage_,
      _keypather_,
      _$timeout_,
      _$state_,
      _$q_
    ) {
      keypather = _keypather_;
      $q = _$q_;
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $localStorage = _$localStorage_;
      $timeout = _$timeout_;
      $state = _$state_;
    });

    if (activeAccountUsername) {
      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.userList[activeAccountUsername]);
    }

    ctx.fakeGo = sinon.stub($state, 'go');
    var ca = $controller('ControllerInstanceHome', {
      '$scope': $scope,
      '$rootScope': $rootScope,
      '$state': $state,
      '$stateParams': ctx.stateParams,
      '$localStorage': $localStorage
    });
    $rootScope.$digest();
  }
  describe('No local storage options'.blue, function () {
    it('should navigate to the first (alphabetical) instance for user', function () {
      setup('SomeKittens');
      expect($scope.loading).to.be.true;
      $rootScope.$digest();
      var userInstance = runnable.newInstance(apiMocks.instances.running, {noStore: true});
      userInstance.attrs.createdBy.username = 'SomeKittens';
      var many = runnable.newInstances(
        [userInstance, apiMocks.instances.stopped],
        {noStore: true}
      );
      many.forEach(function (instance) {
        instance.children = {
          models: [],
          fetch: sinon.stub().callsArg(1)
        };
      });
      many.githubUsername = 'SomeKittens';
      sinon.stub($state, 'includes', function () {
        return true;
      });
      mockFetch.triggerPromise(many);
      $rootScope.$digest();
      expect($scope.loading, 'loading').to.be.false;
      $rootScope.$digest();
      sinon.assert.calledWith(ctx.fakeGo, 'instance.instance', {
        userName: 'SomeKittens',
        instanceName: 'spaaace'
      });
    });

    it('should not navigate when the state changes before the instances return ', function () {
      setup('SomeKittens');
      expect($scope.loading).to.be.true;
      $rootScope.$digest();
      var userInstance = runnable.newInstance(apiMocks.instances.running, {noStore: true});
      userInstance.attrs.createdBy.username = 'SomeKittens';
      var many = runnable.newInstances(
        [userInstance, apiMocks.instances.stopped],
        {noStore: true}
      );
      many.forEach(function (instance) {
        instance.children = {
          models: [],
          fetch: sinon.stub().callsArg(1)
        };
      });
      many.githubUsername = 'SomeKittens';
      sinon.stub($state, 'includes', function () {
        return false;
      });
      mockFetch.triggerPromise(many);
      $rootScope.$digest();
      expect($scope.loading, 'loading').to.be.false;
      sinon.assert.neverCalledWith(ctx.fakeGo, 'instance.instance', {
        userName: 'SomeKittens',
        instanceName: 'spaaace'
      });
    });
    it('should navigate to new for org2', function () {
      setup('org2');
      expect($scope.loading, '$scope.loading').to.be.true;
      $rootScope.$digest();
      var many = runnable.newInstances(
        [],
        {noStore: true}
      );
      many.githubUsername = 'org2';
      mockFetch.triggerPromise(many);
      $rootScope.$digest();
      expect($scope.loading, '$scope.loading').to.be.false;
      sinon.assert.neverCalledWith(ctx.fakeGo, 'instance.new', {
        userName: 'org2'
      });
    });
  });
  describe('local storage options'.blue, function () {
    it('should navigate based on local storage');
  });
  describe('multiple requests for different active accounts'.blue, function () {
    it('should only care about the last requested user, even when the responses are out of order', function () {
      setup('org1');
      expect($scope.loading).to.be.true;

      $rootScope.$digest();

      var many = runnable.newInstances(
        [apiMocks.instances.running, apiMocks.instances.stopped],
        {noStore: true}
      );
      many.forEach(function (instance) {
        instance.children = {
          models: [],
          fetch: sinon.stub().callsArg(1)
        };
      });
      many.githubUsername = 'org1';

      // Change the user
      ctx.stateParams.userName = 'org2';
      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.userList['org2']);

      var ca = $controller('ControllerInstanceHome', {
        '$scope': $scope,
        '$rootScope': $rootScope,
        '$state': $state,
        '$stateParams': ctx.stateParams,
        '$localStorage': $localStorage
      });

      $rootScope.$digest();

      mockFetch.triggerPromise(many);
      $rootScope.$digest();
      sinon.assert.neverCalledWith(ctx.fakeGo, 'instance.instance', {
        userName: 'org1',
        instanceName: 'spaaace'
      });

      var runnable2 = new (require('runnable'))('http://example3.com/');
      var many2 = runnable2.newInstances(
        [],
        {noStore: true, reset: true}
      );
      many2.forEach(function (instance) {
        instance.children = {
          models: [],
          fetch: sinon.stub().callsArg(1)
        };
      });
      many2.githubUsername = 'org2';
      mockFetch.triggerPromise(many2);
      $rootScope.$digest();
      expect($scope.loading).to.be.false;
      sinon.assert.neverCalledWith(ctx.fakeGo, 'instance.new', {
        userName: 'org2'
      });
    });
  });
});
