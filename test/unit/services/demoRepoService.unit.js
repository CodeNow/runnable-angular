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
var mockDemoInstances;

describe('demoRepos', function () {

  function setup() {
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
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('currentOrg', mockCurrentOrg);
      $provide.factory('github', function ($q) {
        mockGithub = {
          forkRepo: sinon.stub().returns($q.when())
        };
        return mockGithub;
      });
      $provide.factory('demoFlowService', function ($q) {
        return {
          usingDemoRepo: sinon.stub().returns(stackNameMock),

        }
      });
      $provide.factory('fetchInstancesByPod', function ($q) {
        fetchInstancesByPodStub = sinon.stub().returns($q.when(mockDemoInstances));
        return fetchInstancesByPodStub;
      });
      $provide.factory('ahaGuide', function ($q) {
        return {
          isInGuide: sinon.stub(),
          isAddingFirstBranch: sinon.stub(),
          isSettingUpRunnabot: sinon.stub()
        };
      });
    });

    angular.mock.inject(function (
      _$rootScope_,
      _demoRepos_,
      _keypather_
    ) {
      $rootScope = _$rootScope_;
      demoRepos = _demoRepos_;
      keypather = _keypather_;
    });
  }

  describe('forkRepo', function () {
    beforeEach(setup);

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
    beforeEach(function () {
      stackNameMock = 'nodejs';
    });

    it('should return the stack name when it is a dependency only', function (done) {
      mockDemoInstances = {
        models: [{
          contextVersion: {
          getMainAppCodeVersion: sinon.stub().returns(null)
          },
          attrs: {
            name: 'MongoDB'
          }
        }]
      };
      setup();
      demoRepos.checkForOrphanedDependency()
        .then(function (stackName) {
          sinon.assert.calledOnce(fetchInstancesByPodStub);
          expect(stackName).to.equal('nodejs');
          done();
        })
        $rootScope.$digest();
    });

    it('should return false if there is no orphaned dependency', function (done) {
      mockDemoInstances = {
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
      };
      setup();
      demoRepos.checkForOrphanedDependency()
        .then(function (stackName) {
          sinon.assert.calledOnce(fetchInstancesByPodStub);
          expect(stackName).to.equal(false);
          done();
        });
      $rootScope.$digest();
    })
  });
});
