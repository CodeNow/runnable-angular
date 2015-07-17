describe('serviceFetch'.bold.underline.blue, function () {
  'use strict';


  describe('factory fetchUser', function () {
    var $state;
    var apiClientBridge;
    var $rootScope;
    var fetchUser;
    var windowMock;

    beforeEach(function () {
      apiClientBridge = {
        createSocket: sinon.spy(),
        fetchUser: sinon.spy()
      };
      windowMock = {
        location: 'foo'
      };
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.value('apiClientBridge', apiClientBridge);
        $provide.value('$window', windowMock);
      });
      angular.mock.inject(function (
        _$state_,
        _fetchUser_,
        _$rootScope_,
        _$window_
      ) {
        $state = _$state_;
        fetchUser = _fetchUser_;
        $rootScope = _$rootScope_;
        $window = _$window_;
      });
    });

    it('should call the fetchUser method of the user service', function (done) {
      apiClientBridge.fetchUser = sinon.stub().callsArgWith(1, null);
      fetchUser().then(function (foundUser) {
        expect(apiClientBridge.fetchUser.calledOnce, 'fetchUser called').to.equal(true);
        expect(apiClientBridge.createSocket.calledOnce, 'createSocket called').to.equal(true);
        expect(foundUser, 'Returned user').to.equal(apiClientBridge);
        done();
      });
      $rootScope.$apply();
    });

    it('should redirect on a 401 error', function (done) {
      $state.go = sinon.stub();
      var err = {
        data: {
          statusCode: 401
        }
      };
      apiClientBridge.fetchUser = sinon.stub().callsArgWith(1, err);
      fetchUser().catch(function (myErr) {
        expect(myErr, 'Returned err').to.equal(err);
        expect(windowMock.location).to.equal('/?password');
        done();
      });
      $rootScope.$apply();
    });
  });

  describe('factory fetchOrgs', function () {
    var user;
    var $rootScope;
    var fetchOrgs;

    beforeEach(function () {
      user = {};
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchUser', function ($q) {
          return function () {
            return $q.when(user);
          };
        });
      });
      angular.mock.inject(function (
        _fetchOrgs_,
        _$rootScope_,
        $q
      ) {
        fetchOrgs = _fetchOrgs_;
        $rootScope = _$rootScope_;

        user.fetchGithubOrgs = sinon.spy(function (cb) {
          setTimeout(cb);
          return 'some value, perhaps';
        });
      });
    });

    it('should call the fetchGithubOrgs method of the user service', function (done) {
      fetchOrgs().then(function (orgs) {
        expect(user.fetchGithubOrgs.calledOnce, 'fetchGithubOrgs called').to.equal(true);
        expect(orgs, 'Returned orgs').to.equal('some value, perhaps');
        done();
      });
      $rootScope.$apply();
      // Need to trigger this after the setTimeout above
      setTimeout(function () {
        $rootScope.$apply();
      }, 50);
    });
  });

  describe('factory fetchInstances', function () {
    var user;
    var $rootScope;
    var fetchInstances;
    var $stateParams;
    var keypather;
    var $state;
    var errs;
    var $timeout;

    var setupFetchInstances = function (fetchUserFactory) {
      errs = {
        handler: sinon.spy()
      };
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchUser', fetchUserFactory);
        $provide.value('errs', errs);
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchInstances_,
        _$stateParams_,
        _keypather_,
        _$state_,
        _$timeout_
      ) {
        $rootScope = _$rootScope_;
        fetchInstances = _fetchInstances_;
        $stateParams = _$stateParams_;
        keypather = _keypather_;
        $state = _$state_;
        $timeout = _$timeout_;
      });
    };


    it('should handle when the user is not signed in', function (done) {
      var err = {
        data: {
          statusCode: 401
        }
      };
      setupFetchInstances(function ($q) {
        return sinon.stub().returns($q.reject(err));
      });

      fetchInstances({}, true).catch(function (userError) {
        expect(userError).to.equal(err);
        done();
      }).catch(function (e) {
        done(e);
      });
      $rootScope.$apply();
    });

    it('should call fetch instances on the user object', function (done) {
      user = {
        models: [
          {
            name: 'MyModel'
          }
        ],
        fetchInstances: sinon.stub().callsArg(1)
      };
      setupFetchInstances(function ($q) {
        return sinon.stub().returns($q.when(user));
      });

      $stateParams.userName = 'Myztiq';

      fetchInstances({name: 'MyModel'}, true).then(function (instance) {
        expect(instance.name).to.equal('MyModel');
        expect(user.fetchInstances.calledOnce).to.equal(true);
        done();
      }).catch(function (e) {
        done(e);
      });
      $rootScope.$apply();
    });

    it('should call fetch instances on the user object and return an array when the search is not for a specific named instance', function (done) {
      user = {
        models: [
          {
            name: 'MyModel'
          }
        ],
        fetchInstances: sinon.stub().callsArg(1)
      };
      setupFetchInstances(function ($q) {
        return sinon.stub().returns($q.when(user));
      });

      $stateParams.userName = 'Myztiq';

      fetchInstances({}, true).then(function (instance) {
        expect(instance.models[0].name).to.equal('MyModel');
        done();
      }).catch(function (e) {
        done(e);
      });
      $rootScope.$apply();
    });

  });

  describe('factory fetchBuild', function () {
    var $rootScope;
    var fetchBuild;
    var user;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchUser', function ($q) {
          user = {
            fetchBuild: sinon.stub().callsArg(1)
          };
          return sinon.stub().returns($q.when(user));
        });
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchBuild_
      ) {
        $rootScope = _$rootScope_;
        fetchBuild = _fetchBuild_;
      });
    });

    it('should call the fetchBuild method of the user', function (done) {
      fetchBuild(123).then(function (fetchedBuild) {
        expect(user.fetchBuild.calledOnce).to.equal(true);
        expect(user.fetchBuild.calledWith(123)).to.equal(true);
        expect(fetchedBuild).to.equal(user);
        done();
      });
      $rootScope.$apply();
    });

  });

  describe('factory fetchOwnerRepos', function () {
    var $rootScope;
    var fetchOwnerRepos;
    var user;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchUser', function ($q) {
          user = {
            oauthName: sinon.stub().returns('Myztiq'),
            fetchGithubRepos: sinon.stub().callsArgWith(1),
            newGithubRepos: sinon.stub().returnsArg(1),
            models: [
              {
                id: 'build ID'
              }
            ]
          };
          return sinon.stub().returns($q.when(user));
        });
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchOwnerRepos_
      ) {
        $rootScope = _$rootScope_;
        fetchOwnerRepos = _fetchOwnerRepos_;
      });
    });

    it('should call the fetchOwnerRepos method of the user', function (done) {
      fetchOwnerRepos('Myztiq').then(function () {
        expect(user.fetchGithubRepos.calledOnce).to.equal(true);
        expect(user.newGithubRepos.calledOnce).to.equal(true);
        expect(user.newGithubRepos.calledWith(user.models)).to.equal(true);
        done();
      });
      $rootScope.$apply();
    });
  });


  describe('factory fetchContexts', function () {
    var $rootScope;
    var fetchContexts;
    var user;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchUser', function ($q) {
          user = {
            fetchContexts: sinon.stub().callsArgWith(1)
          };
          return sinon.stub().returns($q.when(user));
        });
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchContexts_
      ) {
        $rootScope = _$rootScope_;
        fetchContexts = _fetchContexts_;
      });
    });

    it('should call the fetchContexts method of the user', function (done) {
      fetchContexts().then(function (fetchedContexts) {
        expect(user.fetchContexts.calledOnce).to.equal(true);
        expect(fetchedContexts).to.equal(user);
        done();
      });
      $rootScope.$apply();
    });
  });
});