var instances = require('../apiMocks').instances;

describe('serviceFetch'.bold.underline.blue, function () {
  'use strict';
  var data, res;
  var httpFactory = function ($q) {
    return function () {
      var _res = {};
      _res.args = [].slice.call(arguments);
      _res.data = data || {};
      res = _res;
      return $q.when(_res);
    };
  };

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
        expect(windowMock.location).to.equal('/');
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

    it('should default to a object if not options are passed', function () {
      var res;
      $stateParams.userName = 'Myztiq';
      fetchInstances().then(function (_res) { res = _res; });
      $rootScope.$apply();
      expect(res).to.have.property('models');
      expect(res).to.have.property('githubUsername');
    });

    it('should throw an error if the instances is not found', function (done) {
      var res;
      user.fetchInstances = sinon.stub().returns({
         models: null,
         attrs: { a: 1, b: 2, c: 3 }
      });
      $stateParams.userName = 'Myztiq';
      fetchInstances({name: 'MyModel'}, true)
        .then(function () { throw new Error('Should not return'); })
        .catch(function (err) { return; })
        .then(done);
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

    it('should throw an error if no buildId is passed', function () {
      expect(fetchBuild.bind(null)).to.throw(Error, /BuildId/);
    });

  });

  describe('factory fetchOwnerRepos', function () {
    var $rootScope;
    var fetchOwnerRepos;
    var user;
    var attrs = { a: 1, b: 1, c: 1 };

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

    it('should owner repos when there are more than 100 repos', function (done) {
      // Replace stubs
      user.fetchGithubRepos = sinon.stub().callsArgWith(1);
      user.newGithubRepos = sinon.stub().returnsArg(1);
      // Create arrays
      var arrWith100Elements =  Array.apply(null, new Array(100)).map(function (_, i) {return i;});
      var arrWith5Elements =  Array.apply(null, new Array(5)).map(function (_, i) {return i;});
      var spy = sinon.stub();
      spy.withArgs({ page: 1, sort: 'update' }).returns({
        models: arrWith100Elements,
        attrs: attrs
      });
      spy.withArgs({ page: 2, sort: 'update' }).returns({
         models: arrWith5Elements,
         attrs: attrs
      });
      user.fetchGithubRepos = spy;
      fetchOwnerRepos('Myztiq').then(function (_res) {
        expect(user.newGithubRepos.calledOnce).to.equal(true);
        expect(user.fetchGithubRepos.calledTwice).to.equal(true);
        done();
      }).catch(done);
      $rootScope.$apply();
    });

    it('should call the fetchOwnerRepos method of the user, when no user is fetched', function (done) {
      var arr = [ 1, 2, 3 ];
      user.oauthName = sinon.stub().returns('thejsj');
      user.newRepos = sinon.stub().returns([ 1, 2, 3 ]);
      user.newGithubOrg = sinon.stub().returns(user);
      user.fetchRepos = sinon.stub().returns({
         models: arr,
         attrs: attrs
      });
      fetchOwnerRepos('Myztiq').then(function (_res) {
        expect(_res.slice()).to.eql(arr);
        expect(user.fetchRepos.calledOnce).to.equal(true);
        expect(user.newRepos.calledOnce).to.equal(true);
        done();
      })
      .catch(done);
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
    var addInstance;
    var $state;
    var _$q;
    var reporter;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchInstances', function ($q) {
          _$q =  $q;
          rawInstances = runnable.newInstances(instances.listWithPods, {
            noStore: true
          });

          fetchInstancesStub = sinon.stub().returns($q.when(rawInstances));
          return fetchInstancesStub;
        });
        $provide.factory('report', function (){
          reporter = {
            info: sinon.spy()
          };
          return reporter;
        });
        $provide.factory('fetchUser', function ($q) {
          addInstance = sinon.stub();
          return sinon.stub().returns(
            $q.when({
              newInstances: sinon.stub().returns({
                add: addInstance
              })
            })
          );
        });
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchInstancesByPod_,
        _$state_
      ) {
        fetchInstancesByPod = _fetchInstancesByPod_;
        $rootScope = _$rootScope_;
        $state = _$state_;
      });
    });

    it('should fetch all the instances in one go', function (done) {
      fetchInstancesByPod().then(function (instancesByPod) {
        expect(instancesByPod).to.deep.equal({add: addInstance, githubUsername: $state.params.userName});
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

    it('should report that an orphaned child was detected', function (done) {
      // Overwrite rawInstances
      var arrOneModel = rawInstances.models.slice(0, 1);
      arrOneModel[0].masterPod = false;
      arrOneModel[0].attrs.masterPod = false;
      rawInstances.models = arrOneModel;
      // Declare stubs
      fetchInstancesStub = sinon.stub().returns(_$q.when(rawInstances));
      fetchInstancesByPod('userthatdoesntexist').then(function (instancesByPod) {
        expect(reporter.info.calledOnce).to.be.true;
        expect(reporter.info.getCall(0).calledWithMatch('child')).to.be.true;
        done();
      });
      $rootScope.$apply();
    });
  });

  describe('factory fetchPullRequest', function () {
    var $rootScope, fetchPullRequest, configAPIHost;
    var repoName = 'hello';
    var branch = 'master';
    var instance = {
      getBranchName: sinon.spy(function () {
        return branch;
      }),
      contextVersion: {
        getMainAppCodeVersion: sinon.spy(function () {
          return {
            attrs: {
              repo: repoName
            }
          };
        })
      }
    };

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('$http', httpFactory);
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchPullRequest_,
        _configAPIHost_
      ) {
        $rootScope = _$rootScope_;
        fetchPullRequest = _fetchPullRequest_;
        configAPIHost = _configAPIHost_;
      });
    });

    it('should get pull requests from the API', function () {
      fetchPullRequest(instance);
      $rootScope.$apply();
      $rootScope.$digest();
      expect(instance.getBranchName.calledOnce).to.be.true;
      expect(instance.contextVersion.getMainAppCodeVersion.calledOnce).to.be.true;
      expect(res.args[0].url).to.have.string(repoName);
      expect(res.args[0].url).to.have.string(branch);
    });

    it('should return null if there is no branch', function () {
      var res;
      branch = null;
      fetchPullRequest(instance)
        .then(function (_res) { res = _res; });
      $rootScope.$apply();
      $rootScope.$digest();
      expect(res).to.equal(null);
    });
  });

  describe('factory fetchGitHubUser', function () {
    var $rootScope, fetchGitHubuser, configAPIHost;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('$http', httpFactory);
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchGitHubUser_,
        _configAPIHost_
      ) {
        $rootScope = _$rootScope_;
        fetchGitHubUser = _fetchGitHubUser_;
        configAPIHost = _configAPIHost_;
      });
    });

    it('should get the GitHub user from the API', function () {
      var localRes;
      var githubUserName = 'thejsj';
      data = { // for the http module
         hello: 'world'
      };
      fetchGitHubUser(githubUserName)
        .then(function (_res) { localRes = _res; });
      $rootScope.$apply();
      $rootScope.$digest();
      expect(localRes).to.eql(data);
      expect(res.args[0].url).to.have.string('users');
      expect(res.args[0].url).to.have.string(githubUserName);
    });
  });

  describe('factory fetchGitHubMembers', function () {
    var $rootScope, fetchGitHubMembers, configAPIHost;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('$http', httpFactory);
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchGitHubMembers_,
        _configAPIHost_
      ) {
        $rootScope = _$rootScope_;
        fetchGitHubMembers = _fetchGitHubMembers_;
        configAPIHost = _configAPIHost_;
      });
    });

    it('should get the GitHub members from the API', function () {
      var localRes;
      var teamName = 'runnable';
      data = {
         hello: 'world'
      };
      fetchGitHubMembers(teamName)
        .then(function (_res) { localRes = _res; });
      $rootScope.$apply();
      $rootScope.$digest();
      expect(localRes).to.eql(data);
      expect(res.args[0].url).to.have.string('orgs');
      expect(res.args[0].url).to.have.string(teamName);
    });
  });

  describe('factory fetchSlackMembers', function () {
    var $rootScope, fetchSlackMembers, configAPIHost;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('$http', httpFactory);
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchSlackMembers_,
        _configAPIHost_
      ) {
        $rootScope = _$rootScope_;
        fetchSlackMembers = _fetchSlackMembers_;
        configAPIHost = _configAPIHost_;
      });
    });

    it('should return all members that are not bots', function () {
      var token = 'x123', localRes;
      data = { // for the http module
        members: [{
          user: 'thejsj',
          is_bot: false
        }, {
          user: 'runnabledot',
          is_bot: true
        }]
      };
      fetchSlackMembers(token)
        .then(function (_res) { localRes = _res; });
      $rootScope.$apply();
      $rootScope.$digest();
      expect(localRes).to.eql([data.members[0]]);
      expect(res.args[0].url).to.have.string('slack');
      expect(res.args[0].url).to.have.string('token=' + token);
    });

    it('should throw an error if the token is invalid', function () {
      var token = 'x123', err;
      data = { // for the http module
        error: 'invalid_auth',
        ok: false
      };
      $rootScope.$digest();
      fetchSlackMembers(token)
        .catch(function (err) {
          expect(err).to.be.an.instanceof(Error, 'Provided Api');
        });
      $rootScope.$digest();
    });
    it('should throw an error if the token is invalid', function () {
      var token = 'x123', err;
      data = { // for the http module
        error: 'not_invalid_auth',
        ok: false
      };
      $rootScope.$digest();
      fetchSlackMembers(token)
        .catch(function (_err) { err = _err; });
      $rootScope.$digest();
      expect(err).to.be.an.instanceof(Error, 'not_invalid_auth');
    });
  });

  describe('factory fetchSettings', function () {
    var $rootScope, fetchSettings, configAPIHost, $state, integrationsCache;
    var userSettings = {
      userName: 'thejsj',
    };
    var models = [userSettings];

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('$http', httpFactory);
        $provide.factory('fetchUser', function ($q) {
          return function () {
            return $q.when({
              models: models,
              fetchSettings: function (obj, cb) {
                if (obj.githubUsername === userSettings.userName) {
                  userSettings.attrs = {
                    notifications: { hello: 'world' }
                  };
                }
                // Since promisify will return the model, append this to the function
                cb(null, null);
              }
            });
          };
        });
      });
      angular.mock.inject(function (
        _$state_,
        _$rootScope_,
        _fetchSettings_,
        _configAPIHost_,
        _integrationsCache_
      ) {
        $state = _$state_;
        $rootScope = _$rootScope_;
        fetchSettings = _fetchSettings_;
        configAPIHost = _configAPIHost_;
        integrationsCache = _integrationsCache_;
      });
    });

    it('should return the user with the fetched settings (without a cache)', function () {
      var settings;
      $state.params.userName = 'thejsj';
      fetchSettings()
        .then(function (_settings) {
          settings = _settings;
        });
      $rootScope.$digest();
       expect(settings).to.eql(userSettings);
       expect(settings).to.have.property('attrs');
       expect(settings.attrs).to.have.property('notifications');
       expect(settings.attrs.notifications).to.have.property('hello', 'world');
    });

    it('should return results from the cache, if available', function () {
      var settings;
      $state.params.userName = 'hiphipjorge';
      integrationsCache.hiphipjorge = {
        settings: {
          userName: 'hiphipjorge',
          attrs: {
            notifications: { hello: 'wow' }
          }
        }
      };
      fetchSettings()
        .then(function (_settings) {
          settings = _settings;
        });
      $rootScope.$digest();
       expect(settings).to.eql(integrationsCache.hiphipjorge.settings);
       expect(settings).to.have.property('attrs');
       expect(settings.attrs).to.have.property('notifications');
       expect(settings.attrs.notifications).to.have.property('hello', 'wow');
    });

    it('should return undefined if there is no user found', function () {
      models = [];
      var settings;
      $state.params.userName = 'thejsj';
      fetchSettings()
        .then(function (_settings) {
          settings = _settings;
        });
      $rootScope.$digest();
       expect(settings).to.equal(undefined);
    });
  });

  describe('factory fetchRepoBranches', function () {
    var $rootScope, fetchRepoBranches, configAPIHost, $state, integrationsCache;
    var userSettings = {
      userName: 'thejsj',
    };
    var models = [userSettings];

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('$http', httpFactory);
        $provide.factory('fetchUser', function ($q) {
          return function () {
            return $q.when({
              models: models,
              fetchSettings: function (obj, cb) {
                if (obj.githubUsername === userSettings.userName) {
                  userSettings.attrs = {
                    notifications: { hello: 'world' }
                  };
                }
                // Since promisify will return the model, append this to the function
                cb(null, null);
              }
            });
          };
        });
      });
      angular.mock.inject(function (
        _$state_,
        _$rootScope_,
        _fetchRepoBranches_,
        _configAPIHost_,
        _integrationsCache_
      ) {
        $state = _$state_;
        $rootScope = _$rootScope_;
        fetchRepoBranches = _fetchRepoBranches_;
        configAPIHost = _configAPIHost_;
        integrationsCache = _integrationsCache_;
      });
    });

    it('should fetch the repo branches', function () {
      var models = ['master', 'fix', 'hello', 'wow'];
      var settings;
      var repoCollection = {
        models: models,
        newBranches: function (branches) {
           return branches;
        },
        fetchBranches: function (obj, cb) {
          // Since promisify will return the model, append this to the function
          cb(null, null);
        }
      };
      fetchRepoBranches(repoCollection)
        .then(function (_settings) {
          settings = _settings;
        });
      $rootScope.$digest();
      expect(settings).to.eql(models);
    });

    it('should fetch the repo branches when the repo has more than 100', function () {
      // It keeps called itself until it returns less than 100
      var models = [];
      var numberOfBranches = 5;
      models.isModels = true;
      for (var i = 0; i < 99; i++) { models.push('' + i); }
      var branches;
      var repoCollection = {
        models: models,
        fetchBranches: function (obj, cb) {
          var num = numberOfBranches;
          if (obj.page === 1) { num = 100; }
          var branches = {
            // http://stackoverflow.com/questions/3895478/does-javascript-have-a-method-like-range-to-generate-an-array-based-on-suppl
            models: Array.apply(null, new Array(num)).map(function (_, i) {return i;})
          };
          setTimeout(cb.bind(null, null, branches));
          return branches;
        },
        newBranches: function (branches) {
           return branches;
        },
      };
      fetchRepoBranches(repoCollection)
        .then(function (_branches) {
          branches = _branches;
        });
      $rootScope.$digest();
      expect(branches).to.be.an('array');
      expect(branches.length).to.equal(100 + numberOfBranches);
      expect(branches).to.include(99);
      expect(branches).to.include(5);
    });
  });

});
