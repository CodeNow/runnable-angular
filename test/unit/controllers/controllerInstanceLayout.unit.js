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
var mockUserFetch = new (require('../fixtures/mockFetch'))();

describe('ControllerInstanceLayout'.bold.underline.blue, function () {
  var ctx = {};

  function setup(activeAccountUsername) {
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
    ctx.fakeParams = {
      userName: activeAccountUsername,
      instanceName: 'active-instance'
    };

    ctx.userList = {
      user: ctx.fakeuser,
      org1: ctx.fakeOrg1,
      org2: ctx.fakeOrg2
    };

    angular.mock.module('app', function ($provide) {
      $provide.factory('$state', function ($q) {
        return {
          params: ctx.fakeParams,
          go: function (state, opts) {
            expect(state).to.equal('^.home');
            expect(opts.userName).to.be.a.String;
            return $q.when({});
          }
        };
      });
      $provide.factory('fetchUser', mockUserFetch.fetch());
      $provide.factory('fetchInstancesByPod', mockFetch.fetch());
    });
    angular.mock.inject(function (_$controller_,
                                  _$rootScope_,
                                  _$localStorage_,
                                  _keypather_,
                                  _$timeout_,
                                  _$state_,
                                  _$q_) {
      keypather = _keypather_;
      $q = _$q_;
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $localStorage = _$localStorage_;
      $timeout = _$timeout_;
    });

    if (activeAccountUsername) {
      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.userList[activeAccountUsername]);
    }

    ctx.ca = $controller('ControllerInstanceLayout', {
      '$scope': $scope,
      '$rootScope': $rootScope
    });
    $rootScope.$digest();
  }

  it('Sets up data & loads correctly', function () {

    setup('user');
    mockUserFetch.triggerPromise(ctx.userList.user);
    $rootScope.$digest();

    $rootScope.$digest();
    expect($rootScope.isLoading.sidebar).to.be.ok;
    expect(ctx.ca.instancesByPod.length).to.equal(0);
    var many = runnable.newInstances(
      [apiMocks.instances.running, apiMocks.instances.stopped],
      {noStore: true}
    );
    many.githubUsername = 'user';
    mockFetch.triggerPromise(many);
    $rootScope.$digest();
    $scope.$apply();
    expect($rootScope.isLoading.sidebar, 'loadingInstances').to.be.false;
    expect(ctx.ca.instancesByPod, 'instancesByPod').to.equal(many);

    $scope.$apply();
    $scope.$destroy();

  });

  describe('event trigger'.blue, function() {

    it('no username', function () {

      setup('user');
      mockUserFetch.triggerPromise(ctx.userList.user);
      $rootScope.$digest();
      var many = runnable.newInstances(
        [apiMocks.instances.running, apiMocks.instances.stopped],
        {noStore: true}
      );
      many.githubUsername = 'user';
      mockFetch.triggerPromise(many);
      $rootScope.$digest();
      $scope.$apply();
      expect($rootScope.isLoading.sidebar).to.not.be.ok;
      expect(ctx.ca.instancesByPod).to.equal(many);

      $rootScope.$digest();

      expect($rootScope.isLoading.sidebar).to.not.be.ok;
      expect(ctx.ca.instancesByPod).to.be.ok;

      $scope.$apply();

    });
    it('new user', function () {

      setup('org1');
      mockUserFetch.triggerPromise(ctx.userList.user);
      $rootScope.$digest();

      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.userList.org2);
      $rootScope.$digest();
      expect(ctx.ca.instancesByPod.length).to.equal(0);
      var many = runnable.newInstances(
        [apiMocks.instances.running, apiMocks.instances.stopped],
        {noStore: true}
      );
      many.githubUsername = 'org2';
      ctx.fakeParams.userName = 'org2';
      ctx.ca.popoverAccountMenu.actions.selectActiveAccount({
        oauthName: function () {
          return 'org2';
        }
      });
      $timeout.flush();
      mockFetch.triggerPromise(many);
      $rootScope.$digest();
      $scope.$apply();
      expect(ctx.ca.instancesByPod).to.equal(many);
    });
  });

});