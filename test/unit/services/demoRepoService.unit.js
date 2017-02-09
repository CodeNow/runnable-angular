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
        }
      });
      $provide.factory('fetchInstancesByPod', function () {
        fetchInstancesByPodStub = sinon.stub();
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
});
