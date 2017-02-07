/*global runnable:true, user:true, before:true */
'use strict';
var apiMocks = require('../apiMocks');
var instances = apiMocks.instances;
var generateUserObject = apiMocks.generateUserObject;
var generateTeammateInvitationObject = apiMocks.generateTeammateInvitationObject;
var generateGithubUserObject = apiMocks.gh.generateGithubUserObject;
var generateGithubOrgObject = apiMocks.gh.generateGithubOrgObject;

describe('serviceFetch'.bold.underline.blue, function () {
  var res;
  var httpQueue;
  var httpFactoryStub;
  var httpFactory = function ($q) {
    httpFactoryStub = sinon.spy(function () {
      var _res = {};
      _res.args = [].slice.call(arguments);
      if (httpQueue.length === 0) {
        throw new Error('HTTP queue for $http mock is empty');
      }
      _res.data = httpQueue.shift();
      res = _res;
      return $q.when(_res);
    });
    return httpFactoryStub;
  };

  beforeEach(function () {
    httpQueue = [];
  });

  describe('factory fetchUser', function () {
    var $state;
    var apiClientBridge;
    var $rootScope;
    var fetchUser;
    var windowMock;
    var $window;

    beforeEach(function () {
      apiClientBridge = {
        createSocket: sinon.stub(),
        fetchUser: sinon.stub()
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

    it('should call the fetchUser method of the user service', function () {
      apiClientBridge.fetchUser = sinon.stub().callsArgWith(1, null);
      var fetchUserPromise = fetchUser();
      $rootScope.$digest();
      expect(apiClientBridge.fetchUser.calledOnce, 'fetchUser called').to.equal(true);
      expect(apiClientBridge.createSocket.calledOnce, 'createSocket called').to.equal(true);
      expect(fetchUserPromise, 'Returned user').to.eventually.equal(apiClientBridge);
    });

    it('should redirect on a 401 error', function () {
      $state.go = sinon.stub();
      var err = {
        data: {
          statusCode: 401
        }
      };
      apiClientBridge.fetchUser = sinon.stub().callsArgWith(1, err);
      var fetchUserPromise = fetchUser();
      $rootScope.$digest();
      expect(fetchUserPromise, 'Returned err').to.eventually.rejectedWith(err);
      expect(windowMock.location).to.equal('https://runnable.io');
    });
  });

  describe('factory fetchWhitelistedOrgs', function () {
    var user;
    var $rootScope;
    var fetchWhitelistedOrgs;
    var fetchWhitelistsStub;
    var userWhiteListMock;
    var promisifyStub;

    beforeEach(function () {
      userWhiteListMock = [
        { attrs: {
          lowerName: 'a',
          org: {  _id: 1, login: 'A' }
        } },
        { attrs: {
          lowerName: 'b',
          org: { _id: 2, login: 'D' }
        } }
      ];
      user = {
        client: {}
      };
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('promisify', function ($q) {
          promisifyStub = sinon.spy(function (obj, key) {
            return function () {
              return $q.when(obj[key]());
            };
          });
          return promisifyStub;
        });
        $provide.factory('fetchUser', function ($q) {
          return function () {
            return $q.when(user);
          };
        });
        $provide.factory('fetchWhitelists', function ($q) {
          fetchWhitelistsStub = sinon.stub().returns($q.when(userWhiteListMock));
          return fetchWhitelistsStub;
        });
      });
      angular.mock.inject(function (
        _fetchWhitelistedOrgs_,
        _$rootScope_
      ) {
        fetchWhitelistedOrgs = _fetchWhitelistedOrgs_;
        $rootScope = _$rootScope_;
      });
    });

    it('should call the fetchGithubOrgs and fetchUserWhitelists methods of the user service', function () {
      var fetchWhitelistedOrgsPromise = fetchWhitelistedOrgs();
      expect(fetchWhitelistedOrgsPromise).to.eventually.be.fulfilled.then(function (res) {
        sinon.assert.calledOnce(fetchWhitelistsStub);
        sinon.assert.calledOnce(user.fetchGithubOrgs);
      });
    });

    it('should get the right orgs', function (done) {
      var fetchWhitelistedOrgsPromise = fetchWhitelistedOrgs();
      expect(fetchWhitelistedOrgsPromise).to.eventually.be.fulfilled.and.notify(done);
      expect(fetchWhitelistedOrgsPromise).to.eventually.be.fulfilled.then(function (res) {
        expect(res.models).to.be.an('array');
        expect(res.models).to.have.length(2);
        expect(res.models[0]).to.have.deep.property('attrs');
        expect(res.models[0]).to.have.deep.property('attrs.login');
        expect(res.models[0]).to.have.deep.property('attrs.login', 'A');
        expect(res.models[1]).to.have.deep.property('attrs');
        expect(res.models[1]).to.have.deep.property('attrs.login');
        expect(res.models[1]).to.have.deep.property('attrs.login', 'D');
      });
      $rootScope.$digest();
    });
  });

  describe('factory fetchWhitelists', function () {
    var user;
    var fetchWhitelists;
    var promisifyStub;
    var $rootScope;

    beforeEach(function () {
      user = {
        fetchUserWhitelists: sinon.stub().returns({
          models: [
            { attrs: {
              lowerName: 'a',
              org: {  _id: 1, login: 'A' }
            } },
            { attrs: {
              lowerName: 'b'
            } }
          ]
        })
      };
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('promisify', function ($q) {
          promisifyStub = sinon.spy(function (obj, key) {
            return function () {
              return $q.when(obj[key]());
            };
          });
          return promisifyStub;
        });
        $provide.factory('fetchUser', function ($q) {
          return function () {
            return $q.when(user);
          };
        });
      });
      angular.mock.inject(function (
        _fetchWhitelists_,
        _$rootScope_
      ) {
        fetchWhitelists = _fetchWhitelists_;
        $rootScope = _$rootScope_;
      });
    });

    it('should fetch user whitelists', function () {
      var fetchWhitelistsPromise = fetchWhitelists();
      expect(fetchWhitelistsPromise).to.eventually.be.fulfilled.then(function (res) {
        sinon.assert.calledOnce(user.fetchUserWhitelists);
        expect(res.length).to.equal(1);
      });
      $rootScope.$digest();
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
        handler: sinon.stub()
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


    it('should handle when the user is not signed in', function () {
      var err = {
        data: {
          statusCode: 401
        }
      };
      setupFetchInstances(function ($q) {
        return sinon.stub().returns($q.reject(err));
      });

      var fetchInstancesPromise = fetchInstances({}, true);
      $rootScope.$digest();
      expect(fetchInstancesPromise).to.eventually.be.rejectedWith(err);
    });

    it('should call fetch instances on the user object', function () {
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

      var fetchInstancesPromise = fetchInstances({name: 'MyModel'}, true);
      $rootScope.$digest();
      expect(fetchInstancesPromise).to.eventually.have.deep.property('instance.name', 'MyModel');
      sinon.assert.calledOnce(user.fetchInstances);
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

      fetchInstances({}, true)
        .then(function (instance) {
          expect(instance.models[0].name).to.equal('MyModel');
          done();
        })
        .catch(done);
      $rootScope.$digest();
    });

    it('should default to an object if no options are passed', function () {
      var res;
      $stateParams.userName = 'Myztiq';
      fetchInstances().then(function (_res) { res = _res; });
      $rootScope.$digest();
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
      $rootScope.$digest();
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
      $rootScope.$digest();
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

    it('should call the fetchOwnerRepos method of the user', function () {
      fetchOwnerRepos('Myztiq');
      $rootScope.$digest();
      sinon.assert.calledOnce(user.fetchGithubRepos);
      sinon.assert.calledOnce(user.newGithubRepos);
      sinon.assert.calledWith(user.newGithubRepos, user.models);
    });

    it('should owner repos when there are more than 100 repos', function () {
      // Replace stubs
      user.fetchGithubRepos = sinon.stub().callsArgWith(1);
      user.newGithubRepos = sinon.stub().returnsArg(1);
      // Create arrays
      var arrWith100Elements =  Array.apply(null, new Array(100)).map(function (_, i) {return i;});
      var arrWith5Elements =  Array.apply(null, new Array(5)).map(function (_, i) {return i;});
      user.fetchGithubRepos = sinon.stub();
      user.fetchGithubRepos.withArgs({ page: 1, sort: 'update' }).returns({
        models: arrWith100Elements,
        attrs: attrs
      });
      user.fetchGithubRepos.withArgs({ page: 2, sort: 'update' }).returns({
         models: arrWith5Elements,
         attrs: attrs
      });
      fetchOwnerRepos('Myztiq');
      $rootScope.$digest();
      sinon.assert.calledOnce(user.newGithubRepos);
      sinon.assert.calledTwice(user.fetchGithubRepos);
    });

    it('should call the fetchOwnerRepos method of the user, when no user is fetched', function () {
      var arr = [ 1, 2, 3 ];
      user.oauthName = sinon.stub().returns('thejsj');
      user.newRepos = sinon.stub().returns([ 1, 2, 3 ]);
      user.newGithubOrg = sinon.stub().returns(user);
      user.fetchRepos = sinon.stub().returns({
         models: arr,
         attrs: attrs
      });
      var fetchOwnerReposPromise = fetchOwnerRepos('Myztiq');
      $rootScope.$digest();
      expect(fetchOwnerReposPromise).to.eventually.eql(arr);
      sinon.assert.calledOnce(user.fetchRepos);
      sinon.assert.calledOnce(user.newRepos);
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

    it('should call the fetchContexts method of the user', function () {
      var fetchContextsPromise = fetchContexts();
      $rootScope.$digest();
      sinon.assert.calledOnce(user.fetchContexts);
      expect(fetchContextsPromise).to.eventually.equal(user);
    });
  });

  describe('factory fetchInstancesByPod', function () {
    var fetchInstancesByPod;
    var fetchInstancesStub;
    var $rootScope;
    var rawInstances;
    var resetInstance;
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
            info: sinon.stub()
          };
          return reporter;
        });
        $provide.factory('fetchUser', function ($q) {
          resetInstance = sinon.stub();
          return sinon.stub().returns(
            $q.when({
              newInstances: sinon.stub().returns({
                reset: resetInstance
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
      $state.params.userName = 'thejsj';
      fetchInstancesByPod().then(function (instancesByPod) {
        expect(instancesByPod).to.deep.equal({reset: resetInstance, githubUsername: $state.params.userName});
        done();
      });
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchInstancesStub);
      sinon.assert.calledOnce(user.newInstances);
      sinon.assert.calledOnce(resetInstance);

      var instanceList = resetInstance.lastCall.args[0];
      var last = rawInstances.models[rawInstances.length-1];
      var masterInstance = instanceList.find(function (instance) {
        return instance.attrs.contextVersion === last.attrs.contextVersion;
      });

      expect(masterInstance.children.length).to.equal(1);
      expect(masterInstance.children.models[0]).to.equal(last);
    });

    it('should report that an orphaned child was detected', function () {
      // Overwrite rawInstances
      var arrOneModel = rawInstances.models.slice(0, 1);
      arrOneModel[0].masterPod = false;
      arrOneModel[0].attrs.masterPod = false;
      rawInstances.models = arrOneModel;
      // Declare stubs
      fetchInstancesStub.returns(_$q.when(rawInstances));
      fetchInstancesByPod('userthatdoesntexist');
      $rootScope.$digest();
      sinon.assert.calledOnce(reporter.info);
      sinon.assert.calledWithMatch(reporter.info, 'child');
    });
  });

  describe('factory fetchPullRequest', function () {
    var $rootScope, fetchPullRequest, configAPIHost;
    var repoName = 'hello';
    var branch = 'master';
    var instance = {
      getBranchName: sinon.stub().returns(branch),
      contextVersion: {
        getMainAppCodeVersion: sinon.stub().returns({
          attrs: {
             repo: repoName
          }
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
      httpQueue.push({});
      fetchPullRequest(instance);
      $rootScope.$digest();
      sinon.assert.calledOnce(instance.getBranchName);
      sinon.assert.calledOnce(instance.contextVersion.getMainAppCodeVersion);
      expect(res.args[0].url).to.have.string(repoName);
      expect(res.args[0].url).to.have.string(branch);
    });

    it('should return null if there is no branch', function () {
      var res;
      branch = null;
      httpQueue.push({});
      var fetchPullRequestPromise = fetchPullRequest(instance);
      $rootScope.$digest();
      expect(fetchPullRequestPromise).to.eventually.equal(null);
    });
  });

  describe('factory fetchGitHubUser', function () {
    var $rootScope;
    var fetchGitHubUser;
    var configAPIHost;

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
      var data = { // for the http module
         hello: 'world'
      };
      httpQueue.push(data);
      fetchGitHubUser(githubUserName)
        .then(function (_res) { localRes = _res; });
      $rootScope.$digest();
      expect(localRes).to.eql(data);
      expect(res.args[0].url).to.have.string('users');
      expect(res.args[0].url).to.have.string(githubUserName);
    });
  });

  describe('factory fetchGitHubMembers', function () {
    var $rootScope, fetchGitHubMembers, configAPIHost;
    var teamMembers;

    beforeEach(function () {
      teamMembers = [{
         hello: 'world'
      }];
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
      httpQueue.push(teamMembers);
      httpQueue.push([]); // Add an empty array to signify the end of the member list
      fetchGitHubMembers(teamName)
        .then(function (_res) { localRes = _res; });
      $rootScope.$digest();
      expect(localRes).to.deep.eql(teamMembers);
      expect(res.args[0].url).to.have.string('orgs');
      expect(res.args[0].url).to.have.string(teamName);
    });

    it('should handle pagination', function () {
      var localRes;
      var teamName = 'runnable';
      httpQueue.push(teamMembers);
      httpQueue.push(teamMembers);
      httpQueue.push(teamMembers);
      httpQueue.push([]); // Add an empty array to signify the end of the member list
      fetchGitHubMembers(teamName)
        .then(function (_res) { localRes = _res; });
      $rootScope.$digest();
      expect(localRes.length).to.eql(3);
      expect(localRes[2]).to.eql(teamMembers[0]);
      expect(res.args[0].url).to.have.string('orgs');
      expect(res.args[0].url).to.have.string(teamName);
    });

    it('should correctly memoize GH calls', function () {
      httpFactoryStub.reset();
      var localRes;
      var teamName = 'runnable';
      httpQueue.push(teamMembers);
      httpQueue.push(teamMembers);
      httpQueue.push([]); // Add an empty array to signify the end of the member list
      fetchGitHubMembers(teamName)
        .then(function (_res) { localRes = _res; });
      $rootScope.$digest();
      expect(localRes.length).to.eql(2);
      sinon.assert.calledThrice(httpFactoryStub);
      fetchGitHubMembers(teamName)
        .then(function (_res) { localRes = _res; });
      $rootScope.$digest();
      sinon.assert.calledThrice(httpFactoryStub);
    });
  });

  describe('factory fetchGitHubTeamMembersByTeam', function () {
    var $rootScope, fetchGitHubTeamMembersByTeam, configAPIHost;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('$http', httpFactory);
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchGitHubTeamMembersByTeam_,
        _configAPIHost_
      ) {
        $rootScope = _$rootScope_;
        fetchGitHubTeamMembersByTeam = _fetchGitHubTeamMembersByTeam_;
        configAPIHost = _configAPIHost_;
      });
    });

    it('should accept a team object to get the GitHub user from the API', function () {
      var localRes;
      var team = {
        name: 'team',
        id: 123123123
      };

      var data = [
        {
          name: 'member1',
          state: 'active'
        },
        {
          name: 'member2',
          state: 'pending'
        }
      ];
      httpQueue.push(data);
      fetchGitHubTeamMembersByTeam(team)
        .then(function (_res) {
          localRes = _res;
        });

      $rootScope.$digest();
      expect(localRes).to.deep.eql([data[0]]); // member2 is pending and should be removed
      expect(res.args[0].url).to.have.string('/github/teams/' + team.id + '/members');
    });
    it('should accept an id to get the GitHub user from the API', function () {
      var localRes;
      var team = {
        name: 'team',
        id: 123123123
      };

      var data = [
        {
          name: 'member1',
          state: 'active'
        },
        {
          name: 'member2',
          state: 'pending'
        }
      ];
      httpQueue.push(data);
      fetchGitHubTeamMembersByTeam(team.id)
        .then(function (_res) {
          localRes = _res;
        });

      $rootScope.$digest();
      expect(localRes).to.deep.eql([data[0]]); // member2 is pending and should be removed
      expect(res.args[0].url).to.have.string('/github/teams/' + team.id + '/members');
    });
  });

  describe('factory fetchGitHubTeamsByRepo', function () {
    var $rootScope, fetchGitHubTeamsByRepo, configAPIHost;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('$http', httpFactory);
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchGitHubTeamsByRepo_,
        _configAPIHost_
      ) {
        $rootScope = _$rootScope_;
        fetchGitHubTeamsByRepo = _fetchGitHubTeamsByRepo_;
        configAPIHost = _configAPIHost_;
      });
    });

    it('should get the GitHub user from the API', function () {
      var localRes;
      var orgName = 'team';
      var repoName = 'repo';

      var data = [
        {
          name: 'team1',
          permission: 'user'
        },
        {
          name: 'team2',
          permission: 'admin'
        }
      ];
      httpQueue.push(data);
      fetchGitHubTeamsByRepo(orgName, repoName)
        .then(function (_res) {
          localRes = _res;
        });

      $rootScope.$digest();
      expect(localRes).to.deep.eql([data[1]]); // member2 is pending and should be removed

      expect(res.args[0].url).to.have.string('/github/repos/' + orgName + '/' + repoName + '/teams');
    });
  });


  describe('factory fetchGitHubAdminsByRepo', function () {
    var $rootScope, fetchGitHubAdminsByRepo, configAPIHost;
    var fetchGitHubUserMock;
    var members = [
      {
        name: 'member1',
        login: 'member1',
        permissions: {
          admin: true
        }
      },
      {
        name: 'member2',
        login: 'member2',
        permissions: {
          admin: false
        }
      },
      {
        name: 'member3',
        login: 'member3',
        permissions: {
          admin: true
        }
      }
    ];

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('$http', httpFactory);
        $provide.factory('fetchGitHubUser', function ($q) {
          fetchGitHubUserMock = sinon.spy(function (memberName) {
            return $q.when(({
              name: memberName
            }));
          });
          return fetchGitHubUserMock;
        });
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchGitHubAdminsByRepo_,
        _configAPIHost_
      ) {
        $rootScope = _$rootScope_;
        fetchGitHubAdminsByRepo = _fetchGitHubAdminsByRepo_;
        configAPIHost = _configAPIHost_;
      });
    });

    it('should get a list of unique admins for a repo', function (done) {
      var orgName = 'team';
      var repoName = 'repo';

      var data = members;
      httpQueue.push(data);
      fetchGitHubAdminsByRepo(orgName, repoName)
        .then(function (uniqueMembers) {
          expect(fetchGitHubUserMock.callCount).to.eql(2);
          expect(Object.keys(uniqueMembers).length).to.eql(2);
          done();
        });

      $rootScope.$digest();
    });
  });

  describe('factory verifySlackAPITokenAndFetchMembers', function () {
    var $rootScope;
    var verifySlackAPITokenAndFetchMembers;
    var configAPIHost;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('$http', httpFactory);
      });
      angular.mock.inject(function (
        _$rootScope_,
        _verifySlackAPITokenAndFetchMembers_,
        _configAPIHost_
      ) {
        $rootScope = _$rootScope_;
        verifySlackAPITokenAndFetchMembers = _verifySlackAPITokenAndFetchMembers_;
        configAPIHost = _configAPIHost_;
      });
    });

    it('should return all members that are not bots', function () {
      var token = 'x123';
      var data = { // for the http module
        members: [{
          user: 'thejsj',
          is_bot: false
        }, {
          user: 'runnabledot',
          is_bot: true
        }]
      };
      httpQueue.push(data);
      var promise = verifySlackAPITokenAndFetchMembers(token);
      $rootScope.$digest();
      expect(promise).to.eventually.eql([data.members[0]]);
      expect(res.args[0].url).to.have.string('slack');
      expect(res.args[0].url).to.have.string('token=' + token);
    });

    it('should throw an error if the token is invalid', function () {
      var token = 'x123';
      var data = { // for the http module
        error: 'invalid_auth',
        ok: false
      };
      httpQueue.push(data);
      var verifySlackAPITokenAndFetchMembersPromise = verifySlackAPITokenAndFetchMembers(token);
      $rootScope.$digest();
      expect(verifySlackAPITokenAndFetchMembersPromise).to.eventually.be.an.instanceof(Error, 'Provided Api');
    });
    it('should throw an error if the token is invalid', function () {
      var token = 'x123';
      var data = { // for the http module
        error: 'not_invalid_auth',
        ok: false
      };
      httpQueue.push(data);
      var verifySlackAPITokenAndFetchMembersPromise = verifySlackAPITokenAndFetchMembers(token);
      $rootScope.$digest();
      expect(verifySlackAPITokenAndFetchMembersPromise).to.eventually.be.an.instanceof(Error, 'not_invalid_auth');
    });
  });

  describe('factory fetchSettings', function () {
    var $rootScope;
    var fetchSettings;
    var configAPIHost;
    var $state;
    var integrationsCache;
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
    var $rootScope;
    var fetchRepoBranches;
    var configAPIHost;
    var $state;
    var integrationsCache;
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
      var fetchRepoBranchesPromise = fetchRepoBranches(repoCollection);
      $rootScope.$digest();
      expect(fetchRepoBranchesPromise).to.eventually.eql(models);
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
      var fetchRepoBranchesPromise = fetchRepoBranches(repoCollection);
      $rootScope.$digest();
      expect(fetchRepoBranchesPromise).to.eventually.be.an('array');
      expect(fetchRepoBranchesPromise).to.eventually.have.length(100 + numberOfBranches);
      expect(fetchRepoBranchesPromise).to.eventually.include(99);
      expect(fetchRepoBranchesPromise).to.eventually.include(5);
    });
  });

  describe('factory fetchGithubOrgId', function () {
    var $rootScope;
    var fetchGithubOrgId;
    var orgName1 = 'CodeNow';
    var orgId1 = 1;
    var orgName2 = 'Runnable';
    var orgId2 = 2;
    var fetchWhitelistedOrgsResponse = {
      models: [
        { attrs: generateGithubOrgObject(orgName1, orgId1) },
        { attrs: generateGithubOrgObject(orgName2, orgId2) }
      ],
      filter: function (filterFunc) {
        return this.models.filter(filterFunc);
      }
    };

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchWhitelistedOrgs', function ($q) {
          return function () {
            return $q.when(fetchWhitelistedOrgsResponse);
          };
        });
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchGithubOrgId_
      ) {
        $rootScope = _$rootScope_;
        fetchGithubOrgId = _fetchGithubOrgId_;
      });
    });

    it('should fetch the correct github ID for a given github organization name', function () {
      var result1;
      var result2;
      fetchGithubOrgId(orgName1)
        .then(function (res) {
          result1 = res;
        });
      fetchGithubOrgId(orgName2)
        .then(function (res) {
          result2 = res;
        });
      $rootScope.$digest();
      expect(result1).to.equal(orgId1);
      expect(result2).to.equal(orgId2);
    });

    it('should return a reject promise if there is no org with that name', function () {
      var fetchGithubOrgIdPromise = fetchGithubOrgId('orgThatDoesntExist');
      $rootScope.$digest();
      expect(fetchGithubOrgIdPromise).to.be.rejectedWith(TypeError);
    });

    it('should return the same result for an already queried org', function () {
      var result1;
      var result2;
      fetchGithubOrgId(orgName1)
        .then(function (res) {
          result1 = res;
        });
      fetchGithubOrgId(orgName1)
        .then(function (res) {
          result2 = res;
        });
      expect(result2).to.equal(result1);
    });
  });

  describe('factory fetchOrgTeammateInvitations', function () {
    var user;
    var $rootScope;
    var fetchOrgTeammateInvitations;
    var fetchGithubOrgId;
    var fetchUser;

    beforeEach(function () {
      user = {
        fetchTeammateInvitations: sinon.spy(function (opts, cb) {
          var response = {
            models: [
              { attrs: generateTeammateInvitationObject(opts.orgGithubId) }
            ]
          };
          $rootScope.$evalAsync(function () {
            cb(null, response);
          });
          return response;
        })
      };
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchGithubOrgId', function ($q) {
          var org = generateGithubOrgObject();
          fetchGithubOrgId = sinon.stub().returns($q.when(org.id));
          return fetchGithubOrgId;
        });
        $provide.factory('fetchUser', function ($q) {
          fetchUser = sinon.stub().returns($q.when(user));
          return fetchUser;
        });
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchOrgTeammateInvitations_
      ) {
        $rootScope = _$rootScope_;
        fetchOrgTeammateInvitations = _fetchOrgTeammateInvitations_;
      });
    });

    it('should return an error if an non-string or non-number is passed', function () {
      var promise1 = fetchOrgTeammateInvitations([1, 2, 3]);
      var promise2 = fetchOrgTeammateInvitations({ hello: 'world' });
      var promise3 = fetchOrgTeammateInvitations(true);
      $rootScope.$digest();
      expect(promise1).to.be.rejectedWith(TypeError);
      expect(promise2).to.be.rejectedWith(TypeError);
      expect(promise3).to.be.rejectedWith(TypeError);
      sinon.assert.notCalled(fetchUser);
      sinon.assert.notCalled(fetchGithubOrgId);
      sinon.assert.notCalled(user.fetchTeammateInvitations);
    });

    it('should fetch the user and the invitations', function () {
      var org = generateGithubOrgObject();
      var result;
      fetchOrgTeammateInvitations(org.id)
        .then(function (res) {
          result = res;
        });
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchUser);
      sinon.assert.notCalled(fetchGithubOrgId);
      sinon.assert.calledOnce(user.fetchTeammateInvitations);
      expect(result).to.be.an('object');
      expect(result.models).to.be.an('array');
      expect(result.models[0].attrs).to.be.an('object');
      var attrs = result.models[0].attrs;
      expect(attrs.organization).to.be.an('object');
      expect(attrs.organization.github).to.be.a('number');
      expect(attrs.organization.github).to.equal(org.id);
    });

    it('should fetch the id when passed an orgName', function () {
      var org = generateGithubOrgObject();
      var result;
      fetchOrgTeammateInvitations(org.login)
        .then(function (res) {
          result = res;
        });
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchUser);
      sinon.assert.calledOnce(fetchGithubOrgId);
      sinon.assert.calledOnce(user.fetchTeammateInvitations);
      expect(result).to.be.an('object');
      expect(result.models).to.be.an('array');
      expect(result.models[0].attrs).to.be.an('object');
      var attrs = result.models[0].attrs;
      expect(attrs.organization).to.be.an('object');
      expect(attrs.organization.github).to.be.a('number');
      expect(attrs.organization.github).to.equal(org.id);
    });
  });

  describe('factory fetchOrgRegisteredMembers', function () {
    var user;
    var $rootScope;
    var fetchOrgRegisteredMembers;

    beforeEach(function () {
      user = {
        fetchUsers: sinon.spy(function (opts, cb) {
          var response = {
            models: [
              { attrs: generateUserObject() }
            ]
          };
          $rootScope.$evalAsync(function () {
            cb(null, response);
          });
          return response;
        })
      };
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchUser', function ($q) {
          return function () {
            return $q.when(user);
          };
        });
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchOrgRegisteredMembers_
      ) {
        $rootScope = _$rootScope_;
        fetchOrgRegisteredMembers = _fetchOrgRegisteredMembers_;
      });
    });

    it('should fetch all members in an org', function () {
      var result;
      fetchOrgRegisteredMembers('CodeNow')
        .then(function (res) {
          result = res;
        });
      $rootScope.$digest();
      sinon.assert.calledOnce(user.fetchUsers);
      expect(result).to.be.an('object');
      expect(result.models).to.be.an('array');
      expect(result.models).to.have.length(1);
      expect(result.models[0]).to.be.an('object');
      expect(result.models[0].attrs).to.be.an('object');
      var attrs = result.models[0].attrs;
      expect(attrs.email).to.be.an('string');
      expect(attrs.email).to.equal('email@company.com');
      expect(attrs.accounts.github).to.be.an('object');
      expect(attrs.accounts.github.id).to.be.an('number');
      expect(attrs.accounts.github.id).to.equal(12345);
      expect(attrs.accounts.github.username).to.be.a('string');
      expect(attrs.accounts.github.username).to.equal('thejsj');
    });
  });

  describe('factory fetchOrgMembers', function () {
    var username1 = 'thejsj';
    var userId1 = 1;
    var username2 = 'superUser';
    var userId2 = 2;
    var username3 = 'anotherUser';
    var userId3 = 3;
    var orgId = 789;
    var $rootScope;
    var fetchOrgMembers;
    var fetchGitHubMembersResponse = [
      generateGithubUserObject(username1, userId1),
      generateGithubUserObject(username2, userId2),
      generateGithubUserObject(username3, userId3)
    ];
    var fetchOrgRegisteredMembersResponse = {
      models: [
        { attrs: generateUserObject(username1, userId1) }
      ],
      forEach: function (cb) {
        return this.models.forEach(cb);
      }
    };
    var fetchOrgTeammateInvitationResponse = {
      models: [
        { attrs: generateTeammateInvitationObject(orgId, userId1) },
        { attrs: generateTeammateInvitationObject(orgId, userId2) }
      ],
      forEach: function (cb) {
        return this.models.forEach(cb);
      }
    };
    var fetchOrgRegisteredMembersStub;
    var fetchGitHubMembersStub;
    var fetchOrgRegisteredMembersFactory;
    var fetchGitHubMembersFactory;
    var fetchOrgTeammateInvitationsStub;
    var fetchGitHubUserStub;

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchOrgRegisteredMembers', function ($q) {
          fetchOrgRegisteredMembersStub = sinon.stub().returns($q.when(fetchOrgRegisteredMembersResponse));
          return fetchOrgRegisteredMembersStub;
        });
        $provide.factory('fetchGitHubMembers', function ($q) {
          fetchGitHubMembersStub = sinon.stub().returns($q.when(fetchGitHubMembersResponse));
          return fetchGitHubMembersStub;
        });
        $provide.factory('fetchOrgTeammateInvitations', function ($q) {
          fetchOrgTeammateInvitationsStub = sinon.stub().returns($q.when(fetchOrgTeammateInvitationResponse));
          return fetchOrgTeammateInvitationsStub;
        });
        $provide.factory('fetchGitHubUser', function ($q, assign) {
          fetchGitHubUserStub = sinon.spy(function (login) {
            return assign(generateGithubUserObject(login, userId1), {
              email: login + '@example.com'
            });
          });
          return fetchGitHubUserStub;
        });
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchOrgMembers_
      ) {
        $rootScope = _$rootScope_;
        fetchOrgMembers = _fetchOrgMembers_;
      });
    });

    it('should call the write functions', function () {
      var result;
      fetchOrgMembers('CodeNow')
        .then(function (res) {
          result = res;
        });
      $rootScope.$digest();
      expect(result).to.be.an('object');
      sinon.assert.calledOnce(fetchOrgRegisteredMembersStub);
      sinon.assert.calledOnce(fetchOrgTeammateInvitationsStub);
      sinon.assert.calledOnce(fetchGitHubMembersStub);
    });

    it('should correctly fetch the users from the API', function () {
      var result;
      fetchOrgMembers('CodeNow')
        .then(function (res) {
          result = res;
        });
      $rootScope.$digest();
      expect(result).to.be.an('object');
      // Should have 4 properties
      expect(result).to.have.property('all');
      expect(result).to.have.property('registered');
      expect(result).to.have.property('invited');
      expect(result).to.have.property('uninvited');
    });

    it('should know whether the user is registered or not', function () {
      var result;
      fetchOrgMembers('CodeNow')
        .then(function (res) {
          result = res;
        });
      $rootScope.$digest();
      expect(result).to.be.an('object');
     // Should have the right amount of elements
      expect(result.all).to.be.an('array');
      expect(result.registered).to.be.an('array');
      expect(result.invited).to.be.an('array');
      expect(result.uninvited).to.be.an('array');
      expect(result.all.length).to.equal(3);
      expect(result.registered.length).to.equal(1);
      expect(result.invited.length).to.equal(1);
      expect(result.uninvited.length).to.equal(1);
      // Should be populated property
      expect(result.registered[0].login).to.equal(username1);
      expect(result.invited[0].login).to.equal(username2);
      expect(result.uninvited[0].login).to.equal(username3);
    });

    it('should populate the `userModel` property for registered users', function () {
      var result;
      fetchOrgMembers('CodeNow')
        .then(function (res) {
          result = res;
        });
      $rootScope.$digest();
      expect(result).to.be.an('object');
      // Runnable Users
      expect(result.registered[0]).to.be.an('object');
      var registeredUser = result.registered[0];
      expect(registeredUser).to.have.property('login', username1);
      expect(registeredUser).to.have.property('userModel');
      expect(registeredUser.userModel).to.have.property('attrs');
      expect(registeredUser.userModel.attrs).to.be.an('object');
      expect(registeredUser.userModel.attrs).to.have.deep.property('accounts.github.username');
      expect(registeredUser.userModel.attrs.accounts.github.username).to.equal(username1);
    });

    describe('fetch Github user emails', function () {
      it('should fetch the github user email for all GH members', function () {
        var result;
        fetchOrgMembers('CodeNow', true)
          .then(function (res) {
            result = res;
          });
        $rootScope.$digest();
        sinon.assert.called(fetchGitHubUserStub);
        sinon.assert.calledThrice(fetchGitHubUserStub); // Number of users
      });

      it('should fetch the github user email for all GH members and add it to user object', function () {
        var result;
        fetchOrgMembers('CodeNow', true)
          .then(function (res) {
            result = res;
          });
        $rootScope.$digest();
        expect(result.all[0]).to.have.property('email');
        expect(result.all[0].email).to.equal(result.all[0].login + '@example.com');
        expect(result.invited[0]).to.have.property('email');
        expect(result.invited[0].email).to.equal(result.invited[0].login + '@example.com');
      });
    });

  });

  describe('factory fetchGithubUserForCommit', function () {
    var fetchGithubUserForCommit;
    var fetchOrgRegisteredMembersStub;
    var fetchGitHubUserStub;
    var $rootScope;
    var username1 = 'thejsj';
    var userId1 = 1;
    var commit;
    var fetchOrgRegisteredMembersResponse;
    var $q;
    beforeEach(function () {
      commit = {
          fetch: sinon.spy(function (cb) {
            var response = {
              attrs : {
                author: {
                  login: username1
                }
              }
            };
            $rootScope.$evalAsync(function () {
              cb(null, response);
            });
            return response;
          })
      };
      fetchOrgRegisteredMembersResponse = {
        models: [
          { attrs: generateUserObject(username1, userId1) }
        ],
        forEach: function (cb) {
          return this.models.forEach(cb);
        }
      };
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchOrgRegisteredMembers', function ($q) {
          fetchOrgRegisteredMembersStub = sinon.stub().returns($q.when(fetchOrgRegisteredMembersResponse));
          return fetchOrgRegisteredMembersStub;
        });
        $provide.factory('fetchGitHubUser', function ($q) {
          fetchGitHubUserStub = sinon.spy(function (memberName) {
            return $q.when(({
              name: memberName
            }));
          });
          return fetchGitHubUserStub;
        });
      });
      angular.mock.inject(function (
        _$rootScope_,
        _$q_,
        _fetchGithubUserForCommit_
      ) {
        $rootScope = _$rootScope_;
        $q = _$q_;
        fetchGithubUserForCommit = _fetchGithubUserForCommit_;
      });

    });

    it('shoud fetch the commit', function () {
      var fetchGithubUserForCommitPromise = fetchGithubUserForCommit(commit);
      $rootScope.$digest();
      sinon.assert.calledOnce(commit.fetch);
    });

    it('should user the author login to fetch GH user and Runnable user', function () {
      var fetchGithubUserForCommitPromise = fetchGithubUserForCommit(commit);
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchGitHubUserStub);
      sinon.assert.calledOnce(fetchOrgRegisteredMembersStub);
      sinon.assert.calledWith(fetchGitHubUserStub, username1);
      sinon.assert.calledWith(fetchOrgRegisteredMembersStub, username1);
    });

    it('should extend the user object with a `isRunnableUser` property', function () {
      var fetchGithubUserForCommitPromise = fetchGithubUserForCommit(commit);
      expect(fetchGithubUserForCommitPromise).to.eventually.have.deep.property('isRunnableUser');
      $rootScope.$digest();
    });

    it('should have a `isRunnableUser` property that is true if it exists', function () {
      var fetchGithubUserForCommitPromise = fetchGithubUserForCommit(commit);
      expect(fetchGithubUserForCommitPromise).to.eventually.have.deep.property('isRunnableUser', true);
      $rootScope.$digest();
    });

    it('should have a `isRunnableUser` property that is false if it doesnt exist', function () {
      fetchOrgRegisteredMembersStub.returns($q.when({ models: [] }));
      var fetchGithubUserForCommitPromise = fetchGithubUserForCommit(commit);
      expect(fetchGithubUserForCommitPromise).to.eventually.have.deep.property('isRunnableUser', false);
      $rootScope.$digest();
    });

    it('should reject the promise if theres an error fetching the commit', function () {
      var error = new Error('hello world');
      commit.fetch = sinon.spy(function (cb) {
        $rootScope.$evalAsync(function () {
          cb(error, null);
        });
        return;
      });
      var fetchGithubUserForCommitPromise = fetchGithubUserForCommit(commit);
      expect(fetchGithubUserForCommitPromise).to.eventually.be.rejected;
      expect(fetchGithubUserForCommitPromise).to.eventually.be.rejectedWith(error);
      $rootScope.$digest();
    });
  });

  describe('inviteGithubUserToRunnable', function () {
    var user;
    var fetchGithubOrgIdStub;
    var fetchUserStub;
    var $rootScope;
    var $q;
    var inviteGithubUserToRunnable;

    var githubUserId = 123;
    var email = 'jorge@runnable.com';
    var teamName = 'CodeNow';
    var stateUserName = 'stateUsername';
    var orgId = 567;
    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchUser', function ($q, $rootScope) {
          user = {
            createTeammateInvitation: sinon.spy(function (invitationObject, cb) {
            $rootScope.$evalAsync(function () {
              cb(null, user);
            });
            return user;
            })
          };
          fetchUserStub = sinon.stub().returns($q.when(user));
          return fetchUserStub;
        });
        $provide.factory('fetchGithubOrgId', function ($q) {
          fetchGithubOrgIdStub = sinon.stub().returns($q.when(orgId));
          return fetchGithubOrgIdStub;
        });
        $provide.value('$state', {
          params: {
            userName: stateUserName
          }
        });
      });
      angular.mock.inject(function (
        _$rootScope_,
        _$q_,
        _inviteGithubUserToRunnable_
      ) {
        $rootScope = _$rootScope_;
        $q = _$q_;
        inviteGithubUserToRunnable = _inviteGithubUserToRunnable_;
      });
    });

    it('should fetch the user and fetch the GH org id', function () {
      var inviteGithubUserToRunnablePromise = inviteGithubUserToRunnable(githubUserId, email, teamName);
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchUserStub);
      sinon.assert.calledOnce(fetchGithubOrgIdStub);
    });

    it('should fetch the GH org id with the provided teamName', function () {
      var inviteGithubUserToRunnablePromise = inviteGithubUserToRunnable(githubUserId, email, teamName);
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchGithubOrgIdStub);
      sinon.assert.calledWith(fetchGithubOrgIdStub, teamName);
    });

    it('should fetch the GH org id with the $state userName if not teamName is provided', function () {
      var inviteGithubUserToRunnablePromise = inviteGithubUserToRunnable(githubUserId, email);
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchGithubOrgIdStub);
      sinon.assert.calledWith(fetchGithubOrgIdStub, stateUserName);
    });

    it('should create a Teammate invitation', function () {
      var inviteGithubUserToRunnablePromise = inviteGithubUserToRunnable(githubUserId, email);
      $rootScope.$digest();
      sinon.assert.calledOnce(user.createTeammateInvitation);
      sinon.assert.calledWith(user.createTeammateInvitation, {
        organization: {
          github: orgId
        },
        recipient: {
         email: email,
         github: githubUserId
        }
      });
    });

    it('should reject the promise if the invitation isnt created', function () {
      var err = new Error('hello');
      user.createTeammateInvitation = sinon.stub().returns($q.reject(err));
      var inviteGithubUserToRunnablePromise = inviteGithubUserToRunnable(githubUserId, email);
      expect(inviteGithubUserToRunnablePromise).to.eventually.be.rejected;
      expect(inviteGithubUserToRunnablePromise).to.eventually.be.rejectedWith(err);
      $rootScope.$digest();
    });
  });

  describe('fetchStackData', function () {
    var fetchStackData;
    var $rootScope;
    var $q;

    var stacks = angular.copy(apiMocks.stackInfo);
    var fetchStackInfoStub;
    var fetchStackAnalysisStub;
    var $logStub;
    var stackAnalysis;
    var repo = {
      attrs: {
        full_name: 'hello'
      }
    };

    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchStackInfo', function ($q, $rootScope) {
          fetchStackInfoStub = sinon.stub().returns($q.when(stacks));
          return fetchStackInfoStub;
        });
        $provide.factory('fetchStackAnalysis', function ($q, $rootScope) {
          stackAnalysis = {
            languageFramework: 'rails',
            version: {
              'rails': '4.1.8',
              'ruby': '0.8'
            }
          };
          fetchStackAnalysisStub = sinon.stub().returns($q.when(stackAnalysis));
          return fetchStackAnalysisStub;
        });
        $provide.factory('$log', function ($q, $rootScope) {
          $logStub = {
            warn: sinon.stub()
          };
          return $logStub;
        });

      });
      angular.mock.inject(function (
        _$rootScope_,
        _$q_,
        _fetchStackData_
      ) {
        $rootScope = _$rootScope_;
        $q = _$q_;
        fetchStackData = _fetchStackData_;
      });
    });

    it('should fetch the stack info and the stack analysis', function () {
      var fetchStackDataPromise = fetchStackData(repo);
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchStackInfoStub);
      sinon.assert.calledOnce(fetchStackInfoStub);
    });

    it('should warn if there is no framework', function () {
      fetchStackAnalysisStub.returns($q.when({}));
      var fetchStackDataPromise = fetchStackData(repo);
      $rootScope.$digest();
      sinon.assert.calledOnce($logStub.warn);
    });

    it('should get the right data', function (done) {
      var sourceStack = stacks[0];
      var fetchStackDataPromise = fetchStackData(repo)
        .then(function (data) {
          expect(data.key).to.equal(sourceStack.key);
          expect(data.startCommand).to.equal(sourceStack.startCommand);
          expect(data.name).to.equal(sourceStack.name);
          expect(data.suggestedVersion).to.equal('4.1.8');
          expect(data.dependencies[0].suggestedVersion).to.equal('0.8');
          done();
        });
      $rootScope.$digest();
    });

    it('should handle rails', function (done) {
      fetchStackAnalysisStub.returns($q.when({
        languageFramework: 'ruby_ror',
        version: {
          'rails': '4.1.8',
          'ruby': '0.8'
        }
      }));
      var sourceStack = stacks[0];
      var fetchStackDataPromise = fetchStackData(repo)
        .then(function (data) {
          expect(data.key).to.equal(sourceStack.key);
          expect(data.startCommand).to.equal(sourceStack.startCommand);
          expect(data.name).to.equal(sourceStack.name);
          expect(data.suggestedVersion).to.equal('4.1.8');
          expect(data.dependencies[0].suggestedVersion).to.equal('0.8');
          done();
        });
      $rootScope.$digest();
    });
  });

  describe('#waitForWhitelistExist', function () {
    var fetchWhitelistForDockCreatedStub;
    var userWhiteListMock;
    var waitForWhitelistExist;
    var $rootScope;
    var $timeout;

    beforeEach(function () {
      userWhiteListMock = [
        { attrs: { name: 'a' } },
        { attrs: { name: 'b' } }
      ];
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchWhitelistForDockCreated', function ($q) {
          fetchWhitelistForDockCreatedStub = sinon.stub().returns($q.when(userWhiteListMock));
          return fetchWhitelistForDockCreatedStub;
        });
      });
      angular.mock.inject(function (
        _waitForWhitelistExist_,
        _$rootScope_,
        _$timeout_
      ) {
        waitForWhitelistExist = _waitForWhitelistExist_;
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
      });
    });

    it('should fetch the whitelisted orgs', function () {
      waitForWhitelistExist('a');
      $rootScope.$digest();

      sinon.assert.calledOnce(fetchWhitelistForDockCreatedStub);
    });

    it('should return the org if found', function () {
      waitForWhitelistExist('a')
        .then(function (org) {
          expect(org.attrs.name).to.equal('a');
        });
      $rootScope.$digest();
    });

    it('should try again if the org is not found', function () {
      waitForWhitelistExist('c', 2)
        .then(function (org) {
          expect(org.attrs.name).to.equal('c');
        });

      $rootScope.$digest();
      userWhiteListMock.push({ attrs: { name: 'b' } });
      sinon.assert.calledOnce(fetchWhitelistForDockCreatedStub);

      $timeout.flush();
      $rootScope.$digest();

      sinon.assert.calledTwice(fetchWhitelistForDockCreatedStub);
    });

    it('should return an error if never found', function () {
      waitForWhitelistExist('c', 2)
        .catch(function (err) {
          expect(err).to.exist;
        });

      $rootScope.$digest();
      userWhiteListMock.push({ attrs: { name: 'b' } });
      sinon.assert.calledOnce(fetchWhitelistForDockCreatedStub);

      $timeout.flush();
      $rootScope.$digest();

      sinon.assert.calledTwice(fetchWhitelistForDockCreatedStub);
    });
  });
});
