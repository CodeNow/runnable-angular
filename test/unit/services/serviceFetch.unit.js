describe('serviceFetch'.bold.underline.blue, function () {
  'use strict';


  describe('factory pFetchUser', function () {
    var $state;
    var user;
    var $rootScope;
    var pFetchUser;

    beforeEach(function () {
      user = {
        createSocket: sinon.spy(),
        fetchUser: sinon.spy()
      };
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.value('user', user);
      });
      angular.mock.inject(function (
        _$state_,
        _pFetchUser_,
        _$rootScope_
      ) {
        $state = _$state_;
        pFetchUser = _pFetchUser_;
        $rootScope = _$rootScope_;
      });
    });

    it('should call the fetchUser method of the user service', function (done) {
      user.fetchUser = sinon.stub().callsArgWith(1, null);
      pFetchUser().then(function (foundUser) {
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
      user.fetchUser = sinon.stub().callsArgWith(1, err);
      pFetchUser().catch(function (myErr) {
        expect(myErr, 'Returned err').to.equal(err);
        expect($state.go.calledWith('home'), 'Called go home on the state').to.equal(true);
        done();
      });
      $rootScope.$apply();
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

    var setupFetchInstances = function (pFetchUserFactory) {
      errs = {
        handler: sinon.spy()
      };
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('pFetchUser', pFetchUserFactory);
        $provide.value('errs', errs);
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchInstances_,
        _$stateParams_,
        _keypather_,
        _$state_
      ) {
        $rootScope = _$rootScope_;
        fetchInstances = _fetchInstances_;
        $stateParams = _$stateParams_;
        keypather = _keypather_;
        $state = _$state_;
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

      fetchInstances().catch(function (userError) {
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

      fetchInstances({name: 'MyModel'}).then(function (instance) {
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

      fetchInstances().then(function (instance) {
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
        $provide.factory('pFetchUser', function ($q) {
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
        $provide.factory('pFetchUser', function ($q) {
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
        $provide.factory('pFetchUser', function ($q) {
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