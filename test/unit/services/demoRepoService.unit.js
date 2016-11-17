'use strict';

var $rootScope;
var keypather;
var mockGithub;
var mockCurrentOrg;
var demoRepos;

describe.only('demoRepos', function () {

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
    angular.mock.module('app', function ($provide) {
      $provide.value('currentOrg', mockCurrentOrg)
      $provide.service('github', function ($q) {
        mockGithub = {
          forkRepo: sinon.stub().returns($q.when())
        };
        return mockGithub;
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

  beforeEach(setup);

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
      demoRepos.forkGithubRepo('php');
      $rootScope.$digest();

      sinon.assert.calledOnce(mockGithub.forkRepo);
      sinon.assert.calledWithExactly(mockGithub.forkRepo,
        'RunnableDemo',
        'laravel-starter',
        'myOauthName',
        true
      );
    });
  });
});
