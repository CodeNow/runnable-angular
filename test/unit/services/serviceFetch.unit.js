var instances = require('../apiMocks').instances;

describe('serviceFetch'.bold.underline.blue, function () {
  'use strict';


  describe('factory fetchUser', function () {
    var $state;
    var user;
    var $rootScope;
    var fetchUser;
    var windowMock;

    beforeEach(function () {
      user = {
        createSocket: sinon.spy(),
        fetchUser: sinon.spy()
      };
      windowMock = {
        location: 'foo'
      };
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.value('user', user);
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
      user.fetchUser = sinon.stub().callsArgWith(1, null);
      fetchUser().then(function (foundUser) {
        expect(user.fetchUser.calledOnce, 'fetchUser called').to.equal(true);
        expect(user.createSocket.calledOnce, 'createSocket called').to.equal(true);
        expect(foundUser, 'Returned user').to.equal(user);
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
      var startLocation = windowMock.location;
      user.fetchUser = sinon.stub().callsArgWith(1, err);
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

  describe('factory fetchInstancesByPod', function () {
    var fetchInstancesByPod;
    var fetchInstancesStub;
    var $rootScope;
    var rawInstances;
    var user;
    var addInstance;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchInstances', function ($q) {
          rawInstances = runnable.newInstances(instances.listWithPods, {
            noStore: true
          });

          fetchInstancesStub = sinon.stub().returns($q.when(rawInstances));
          return fetchInstancesStub;
        });
        $provide.factory('fetchUser', function ($q) {
          addInstance = sinon.stub();
          user = {
            newInstances: sinon.stub().returns({
              add: addInstance
            })
          };
          return sinon.stub().returns($q.when(user));
        });
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchInstancesByPod_
      ) {
        fetchInstancesByPod = _fetchInstancesByPod_;
        $rootScope = _$rootScope_;
      });
    });

    it('should fetch all the instances in one go', function (done) {
      fetchInstancesByPod().then(function (instancesByPod) {
        expect(instancesByPod).to.deep.equal({add: addInstance});
        done();
      });
      $rootScope.$apply();
      sinon.assert.calledOnce(fetchInstancesStub);
      sinon.assert.calledOnce(user.newInstances);
      sinon.assert.calledOnce(addInstance);

      var instanceList = addInstance.lastCall.args[0];
      var last = rawInstances.models[rawInstances.length-1];
      var masterInstance = instanceList.find(function (instance) {
        return instance.attrs.contextVersion === last.attrs.contextVersion;
      });

      expect(masterInstance.children.length).to.equal(1);
      expect(masterInstance.children.models[0]).to.equal(last);
    });
  });
});