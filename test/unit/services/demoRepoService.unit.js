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

describe('demoRepos', function () {

  beforeEach(function () {
    mockRepoModel = {
      repoModel: true
    };
    mockCurrentOrg = {
      poppa: {
        attrs: {
          isPersonalAccount: true,
        }
      },
      github: {
        oauthName: sinon.stub().returns('myOauthName')
      }
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
    it('should fetch the user', function () {
    });

    it('should create a new instance model', function () {
    });

    it('should create a new Instance', function () {
    });
  });

  describe('fecthContextVersionForStack', function () {
    it('should fetch the user', function () {
    });

    it('should fetch the context', function () {
    });

    it('should throw an error if not contexts are found', function () {
    });

    it('should fetch the context versions', function () {
    });

    it('fetch the github repo branches', function () {
    });

    it('should throw an erro if no context versions are found', function () {
    });
  });

  describe('createDemoAppForPersonalAccounts', function () {
    it('should fetch the owner repo', function () {
    });

    it('should fetch the context verion for stack', function () {
    });

    it('should invite runnabot', function () {
    });

    it('should create new build, fetch stack, fetch instances, find dependencies', function () {
    });

    it('should replace the ENVs', function () {
    });

    it('should create the instance', function () {
    });

    it('should create an auto isolation config', function () {
    });
  });
});
