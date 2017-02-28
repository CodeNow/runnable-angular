'use strict';

var $rootScope;
var keypather;
var mockGithub;
var mockCurrentOrg;
var stacks = {
  nodejs: {
    displayName: 'Node.js'
  }
};
var demoRepos;
var stackNameMock;
var fetchInstancesByPodStub;
var $timeout;
var $q;
var fetchOwnerRepoStub;
var mockRepoModel;
var fetchUserStub;
var createNewInstanceStub;
var promisifyStub;
var fetchGitHubRepoBranchStub;
var invitePersonalRunnabotStub;
var createNewBuildByContextVersionStub;
var fetchStackDataStub;

var userMock;
var contexts;
var versions;
var acv;
var instanceMock;
var instanceModelMock;
var branchMock;
var buildMock;
var stackDataMock;

describe('demoRepos', function () {

  beforeEach(function () {
    var commit = 'asdfasasdfa98aisf798as';
    instanceMock = {};
    buildMock = {};
    stackDataMock = {};
    instanceModelMock = {};
    acv = {
      attrs: {
        branch: 'master',
        commit: commit
      }
    };
    versions = [
      {
        getMainAppCodeVersion: sinon.stub().returns(acv),
        attrs: {
          build: {
            failed: false
          }
        }
      }
    ];
    contexts = [
      { attrs: { name: 'node-starter' }, fetchVersions: sinon.stub().returns(versions) },
      { attrs: { name: 'rails-starter' } },
      { attrs: { name: 'django-starter' } },
      { attrs: { name: 'laravel-starter' } }
    ];
    userMock = {
      newInstance: sinon.stub().returns(instanceMock),
      fetchContexts: sinon.stub().returns(contexts)
    };
    mockRepoModel = {
      repoModel: true
    };
    branchMock = {
      commit: {
        sha: commit
      }
    };
    mockCurrentOrg = {
      poppa: {
        attrs: {
          isPersonalAccount: true,
        }
      },
      github: {
        oauthName: sinon.stub().returns('myOauthName')
      },
      getDisplayName: sinon.stub().returns('myOauthName')
    };
    stackNameMock = 'nodejs';
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('currentOrg', mockCurrentOrg);
      $provide.factory('github', function ($q) {
        mockGithub = {
          forkRepo: sinon.stub().returns($q.when())
        };
        return mockGithub;
      });
      $provide.factory('demoFlowService', function () {
        return {
          usingDemoRepo: sinon.stub().returns(stackNameMock)
        };
      });
      $provide.factory('fetchUser', function ($q) {
        fetchUserStub = sinon.stub().returns($q.when(userMock));
        return fetchUserStub;
      });
      $provide.factory('createNewInstance', function ($q) {
        createNewInstanceStub = sinon.stub().returns($q.when(instanceModelMock));
        return createNewInstanceStub;
      });
      $provide.factory('invitePersonalRunnabot', function ($q) {
        invitePersonalRunnabotStub = sinon.stub().returns($q.when());
        return invitePersonalRunnabotStub;
      });
      $provide.factory('promisify', function ($q) {
        promisifyStub = sinon.spy(function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyStub;
      });
      $provide.factory('fetchGitHubRepoBranch', function ($q) {
        fetchGitHubRepoBranchStub = sinon.stub().returns($q.when(branchMock));
        return fetchGitHubRepoBranchStub;
      });
      $provide.factory('createNewBuildByContextVersion', function ($q) {
        createNewBuildByContextVersionStub = sinon.stub().returns($q.when(buildMock));
        return createNewBuildByContextVersionStub;
      });
      $provide.factory('fetchStackData', function ($q) {
        fetchStackDataStub = sinon.stub().returns($q.when(stackDataMock));
        return fetchStackDataStub;
      });
      $provide.factory('fetchInstancesByPod', function ($q) {
        fetchInstancesByPodStub = sinon.stub().returns($q.when({models: []}));
        return fetchInstancesByPodStub;
      });
      $provide.factory('ahaGuide', function () {
        return {
          isInGuide: sinon.stub(),
          isAddingFirstBranch: sinon.stub(),
          isSettingUpRunnabot: sinon.stub()
        };
      });
      $provide.factory('fetchOwnerRepo', function ($q) {
        fetchOwnerRepoStub = sinon.stub().returns($q.when(mockRepoModel));
        return fetchOwnerRepoStub;
      });
    });

    angular.mock.inject(function (
      _$rootScope_,
      _demoRepos_,
      _$q_,
      _$timeout_,
      _keypather_
    ) {
      $timeout = _$timeout_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      demoRepos = _demoRepos_;
      keypather = _keypather_;
    });
  });

  describe('forkRepo', function () {

    it('should fail when the stack doesn\'t exist', function (done) {
      demoRepos.forkGithubRepo('sdafasdfaf')
        .catch(function (err) {
          expect(err.message).to.equal('Stack doesn\'t exist');
          done();
        });
      $rootScope.$digest();
    });
    it('should make a github request', function () {
      $rootScope.$digest();
      demoRepos.forkGithubRepo('php');

      sinon.assert.calledOnce(mockGithub.forkRepo);
      sinon.assert.calledWithExactly(mockGithub.forkRepo,
        'RunnableDemo',
        'laravel-starter',
        'myOauthName',
        true
      );
    });
  });

  describe('orphaned dependencies', function () {
    it('should return the stack name when it is a dependency only', function (done) {
      fetchInstancesByPodStub.reset();
      fetchInstancesByPodStub.returns($q.when({
        models: [{
          contextVersion: {
          getMainAppCodeVersion: sinon.stub().returns(null)
          },
          attrs: {
            name: 'MongoDB'
          }
        }]
      }));
      demoRepos.checkForOrphanedDependency('nodejs')
        .then(function (stackName) {
          sinon.assert.calledOnce(fetchInstancesByPodStub);
          expect(stackName).to.equal('nodejs');
          done();
        });
        $rootScope.$digest();
    });

    it('should return false if there is no orphaned dependency', function (done) {
      fetchInstancesByPodStub.reset();
      fetchInstancesByPodStub.returns($q.when({
       models: [{
        contextVersion: {
          getMainAppCodeVersion: sinon.stub().returns(null)
        },
        attrs: {
          name: 'MongoDB'
        }
        },
        {
          contextVersion: {
            getMainAppCodeVersion: sinon.stub().returns('nodejs')
          },
          attrs: {
            name: 'node-starter'
          }
        }]
      }));
      demoRepos.checkForOrphanedDependency('nodejs')
        .then(function (stackName) {
          sinon.assert.calledOnce(fetchInstancesByPodStub);
          expect(stackName).to.equal(false);
          done();
        });
      $rootScope.$digest();
    });
  });

  describe('_findNewRepoOnRepeat', function () {
    var stack;
    beforeEach(function () {
      stack = 'testStack';
      sinon.spy(demoRepos, '_findNewRepoOnRepeat');
    });

    it('should return the repo model', function () {
      var sampleObj = {
        output: {
          statusCode: 401
        }
      };
      fetchOwnerRepoStub.returns($q.when(sampleObj));
      demoRepos._findNewRepoOnRepeat(stack)
        .then(function (repo) {
          expect(repo).to.equal(sampleObj);
        })
        .catch(function (err) {
          throw err;
        });
      $rootScope.$digest();
    });

    it('should increment count and call again on 404', function () {
      fetchOwnerRepoStub.returns($q.reject({
        output: {
          statusCode: 404
        }
      }));
      demoRepos._findNewRepoOnRepeat(stack);
      $rootScope.$digest();
      $timeout.flush();
      sinon.assert.calledTwice(fetchOwnerRepoStub);
      $timeout.flush();
      sinon.assert.calledThrice(fetchOwnerRepoStub);
    });

    it('should throw error on non 404', function () {
      var sampleErr = {
        output: {
          statusCode: 401
        }
      };
      fetchOwnerRepoStub.returns($q.reject(sampleErr));
      demoRepos._findNewRepoOnRepeat(stack)
        .then(function () {
          throw new Error('Should not have been success');
        })
        .catch(function (err) {
          expect(err).to.equal(sampleErr);
        });
      $rootScope.$digest();
    });

    it('should reject on 31st try', function () {
      demoRepos._findNewRepoOnRepeat(stack, 31)
        .then(function () {
          throw new Error('Should not have been success');
        })
        .catch(function (err) {
          expect(err).to.equal('We were unable to find the repo we just forked. Please try again!');
        });
      $rootScope.$digest();
    });
  });

  describe('createInstance', function () {
    var containerName;
    var build;
    var activeAccount;
    var opts;
    var oauthName = 'thejsj';
    var env1 = 'HELLO=WORLD';
    var port1 = 8080;
    var port2 = 3000;
    beforeEach(function () {
      containerName = 'container-name';
      build = {};
      activeAccount = {
        oauthName: sinon.stub().returns(oauthName)
      };
      opts = {
        env: [env1],
        ports: [port1, port2]
      };
    });

    it('should fetch the user', function () {
      demoRepos.createInstance(containerName, build, activeAccount, opts);
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchUserStub);
    });

    it('should create a new instance model', function () {
      demoRepos.createInstance(containerName, build, activeAccount, opts);
      $rootScope.$digest();
      sinon.assert.calledOnce(userMock.newInstance);
      sinon.assert.calledWith(userMock.newInstance, {
        name: containerName,
        owner: {
          username: oauthName
        },
      }, { warn: false });
    });

    it('should create a new Instance', function () {
      demoRepos.createInstance(containerName, build, activeAccount, opts);
      $rootScope.$digest();
      sinon.assert.calledOnce(createNewInstanceStub);
      var finalOpts = {
        masterPod: true,
        name: containerName,
        env: [ env1 ],
        ipWhitelist: { enabled: false },
        isTesting: false,
        ports: [ port1, port2 ],
        shouldNotAutofork: false,
      };
      console.log('2o2');
      sinon.assert.calledWith(createNewInstanceStub, activeAccount, build, finalOpts, instanceMock);
    });
  });

  describe('fetchContextVersionForStack', function () {
    var stack;
    beforeEach(function () {
      stack = angular.extend({}, demoRepos.demoStacks.nodejs);
    });

    it('should fetch the user', function () {
      demoRepos.fetchContextVersionForStack(stack);
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchUserStub);
    });

    it('should fetch the contexts', function () {
      var error = null;
      demoRepos.fetchContextVersionForStack(stack)
        .catch(function (err) { error = err; });
      $rootScope.$digest();
      sinon.assert.calledOnce(userMock.fetchContexts);
      sinon.assert.calledWith(userMock.fetchContexts, { isSource: true });
      expect(error).to.equal(null);
    });

    it('should throw an error if not contexts are found', function () {
      var error = null;
      userMock.fetchContexts.returns([
        { name: 'idontknow' }
      ]);
      demoRepos.fetchContextVersionForStack(stack)
        .catch(function (err) { error = err; });
      $rootScope.$digest();
      sinon.assert.calledOnce(userMock.fetchContexts);
      sinon.assert.calledWith(userMock.fetchContexts, { isSource: true });
      expect(error).to.not.equal(null);
      expect(error.message).to.match(/no.*context.*found/i);
    });

    it('should fetch the context versions', function () {
      demoRepos.fetchContextVersionForStack(stack);
      $rootScope.$digest();
      sinon.assert.calledOnce(contexts[0].fetchVersions);
      sinon.assert.calledWith(contexts[0].fetchVersions, { qs: { sort: '-created' } });
    });

    it('fetch the github repo branches', function () {
      demoRepos.fetchContextVersionForStack(stack);
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchGitHubRepoBranchStub);
      sinon.assert.calledWith(fetchGitHubRepoBranchStub, stack.repoOwner, stack.repoName, stack.branchName);
    });

    it('should throw an error if no context versions are found', function () {
      var error = null;
      versions[0].attrs.build.failed = true;
      contexts[0].fetchVersions.returns(versions);
      demoRepos.fetchContextVersionForStack(stack)
        .catch(function (err) { error = err; });
      $rootScope.$digest();
      expect(error).to.not.equal(null);
      expect(error.message).to.match(/no.*context.*version.*found/i);
    });
  });

  describe('createDemoAppForPersonalAccounts', function () {
    var version;
    var stack;
    var depsMock;
    beforeEach(function () {
      version = {};
      stack = angular.extend({}, demoRepos.demoStacks.nodejs);
      sinon.stub(demoRepos, 'fetchContextVersionForStack').returns($q.when(version));
      sinon.stub(demoRepos, 'findDependencyNonRepoInstances').returns($q.when(depsMock));
    });

    afterEach(function () {
      demoRepos.fetchContextVersionForStack.restore();
      demoRepos.findDependencyNonRepoInstances.restore();
    });

    it.only('should fetch the owner repo', function () {
      demoRepos.createDemoAppForPersonalAccounts('nodejs');
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchOwnerRepoStub);
      sinon.assert.calledWith(fetchOwnerRepoStub, stack.repoOwner, stack.repoName);
    });

    it('should fetch the context verion for stack', function () {
      demoRepos.createDemoAppForPersonalAccounts('nodejs');
      $rootScope.$digest();
      sinon.assert.calledOnce(demoRepos.fetchContextVersionForStack);
      sinon.assert.calledWith(demoRepos.fetchContextVersionForStack, stack);
    });

    it('should invite runnabot', function () {
      demoRepos.createDemoAppForPersonalAccounts('nodejs');
      $rootScope.$digest();
      sinon.assert.calledOnce(invitePersonalRunnabotStub);
      sinon.assert.calledWith(invitePersonalRunnabotStub, {
         repoName: stack.repoName,
         githubUserName: sinon.match.string
      });
    });

    it('should create new build, fetch stack, fetch instances, find dependencies', function () {
      demoRepos.createDemoAppForPersonalAccounts('nodejs');
      $rootScope.$digest();
    });

    it('should replace the ENVs', function () {
      demoRepos.createDemoAppForPersonalAccounts('nodejs');
      $rootScope.$digest();
    });

    it('should create the instance', function () {
      demoRepos.createDemoAppForPersonalAccounts('nodejs');
      $rootScope.$digest();
    });

    it('should create an auto isolation config', function () {
      demoRepos.createDemoAppForPersonalAccounts('nodejs');
      $rootScope.$digest();
    });
  });
});
