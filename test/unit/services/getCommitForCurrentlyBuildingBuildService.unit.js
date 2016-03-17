'use strict';
var apiMocks = require('../apiMocks');
var mockUserFetch = new (require('../fixtures/mockFetch'))();
var instances = apiMocks.instances;
var generateUserObject = apiMocks.generateUserObject;
var generateTeammateInvitationObject = apiMocks.generateTeammateInvitationObject;
var generateGithubUserObject = apiMocks.gh.generateGithubUserObject;
var generateGithubOrgObject = apiMocks.gh.generateGithubOrgObject;

describe.only('getIncompleteBuidldsForInstanceBranch'.bold.underline.blue, function () {
  var promisifyStub;
  var fetchUser;
  var $rootScope;

  var user;
  var commitHash = '2349sdf';
  var contextId = 238423;
  var repoName = 'RepoName';
  var branchName = 'hello-world';
  var contextVersion = {
    context: contextId,
    build: {},
    appCodeVersions: [{
      repo: repoName,
      commit: commitHash
    }]
  };
  var instance = {
    contextVersion: {
      attrs: contextVersion
    },
    attrs: {
      contextVersion: contextVersion
    }
  };

  var getIncompleteBuidldsForInstanceBranch;

  beforeEach(function () {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.factory('fetchUser', function ($q) {
        user = {
          context: {
            contextVersion: instance.attrs.contextVersion
          }
        };
        user.fetchContext = sinon.stub().returns($q.when(user.context));
        user.context.fetchVersions = sinon.stub().returns($q.when([instance.contextVersion]));
        return sinon.stub().returns($q.when(user));
      });
      $provide.factory('promisify', function ($q) {
        promisifyStub = sinon.spy(function (obj, key) {
          return function () {
            var args = Array.prototype.slice.call(arguments);
            return $q.when(obj[key].apply(obj, arguments));
          };
        });
        return promisifyStub;
      });
    });

    angular.mock.inject(function (
      _fetchUser_,
      _$rootScope_,
      _getIncompleteBuidldsForInstanceBranch_
    ) {
      fetchUser = _fetchUser_;
      $rootScope = _$rootScope_;
      getIncompleteBuidldsForInstanceBranch = _getIncompleteBuidldsForInstanceBranch_;
    });
  });

  it('should fetch the user and call all methods', function () {
    var result;
    getIncompleteBuidldsForInstanceBranch(instance,  branchName)
      .then(function (res) {
        result = res;
      });
    $rootScope.$digest();
    sinon.assert.calledOnce(fetchUser);
    sinon.assert.calledOnce(user.fetchContext);
    sinon.assert.calledWith(user.fetchContext, contextId);
    sinon.assert.calledOnce(user.context.fetchVersions);
    sinon.assert.calledWith(user.context.fetchVersions, {
      build: {
          completed: false,
          started: true,
          triggeredAction: {
            manual: false
          }
        },
        repo: repoName,
        branch: branchName,
        limit: 1,
        sort: '-created',
    });
  });

  it('should return an array with builds and commits', function () {
    var result;
    getIncompleteBuidldsForInstanceBranch(instance,  branchName)
      .then(function (res) {
        result = res;
      });
    $rootScope.$digest();
    expect(result).to.be.an('array');
    expect(result[0]).to.be.an('object');
    expect(result[0].build).to.be.an('object');
    expect(result[0].build).to.equal(contextVersion.build);
    expect(result[0].commit).to.be.an('string');
    expect(result[0].commit).to.equal(commitHash);
  });
});

describe.only('getCommitForCurrentlyBuildingBuild'.bold.underline.blue, function () {
  var $rootScope;
  var getCommitForCurrentlyBuildingBuild;
  var getIncompleteBuidldsForInstanceBranch;
  var fetchCommitDataMock;

  var commitHash = '223423349sdf';
  var commit = {};
  var branchName = 'HelloWorld';
  var instance;
  var contextVersions;
  var acv = {};

  beforeEach(function () {
    instance = {
      attrs: {
        locked: false,
        contextVersion: {
          appCodeVersions: [{
            branch: branchName
          }],
          build: {
            started: 2
          }
        }
      },
      contextVersion: {
        getMainAppCodeVersion: sinon.stub().returns(acv)
      }
    };
    contextVersions = [{
      build: {
        started: 3,
      },
      commit: commitHash
    }];

    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.factory('fetchCommitData', function ($q) {
        fetchCommitDataMock = {
          activeCommit: sinon.stub().returns($q.when(commit))
        };
        return fetchCommitDataMock;
      });
      $provide.factory('getIncompleteBuidldsForInstanceBranch', function ($q) {
        getIncompleteBuidldsForInstanceBranch = sinon.spy(function () {
          return $q.when(contextVersions);
        });
        return getIncompleteBuidldsForInstanceBranch;
      });
    });

    angular.mock.inject(function (
      _$rootScope_,
      _getCommitForCurrentlyBuildingBuild_
    ) {
      $rootScope = _$rootScope_;
      getCommitForCurrentlyBuildingBuild = _getCommitForCurrentlyBuildingBuild_;
    });
  });

  it('should return false if locked', function () {
    instance.attrs.locked = true;

    var result;
    getCommitForCurrentlyBuildingBuild(instance)
      .then(function (res) {
        result = res;
      });
    $rootScope.$digest();
    sinon.assert.notCalled(getIncompleteBuidldsForInstanceBranch);
    sinon.assert.notCalled(fetchCommitDataMock.activeCommit);
    expect(result).to.equal(false);
  });

  it('should return the commit hash if there are incompleted builds', function () {
    var result;
    getCommitForCurrentlyBuildingBuild(instance)
      .then(function (res) {
        result = res;
      });
    $rootScope.$digest();
    sinon.assert.calledOnce(getIncompleteBuidldsForInstanceBranch);
    sinon.assert.calledWith(getIncompleteBuidldsForInstanceBranch, instance, branchName);
    sinon.assert.calledOnce(instance.contextVersion.getMainAppCodeVersion);
    sinon.assert.calledOnce(fetchCommitDataMock.activeCommit);
    sinon.assert.calledWith(fetchCommitDataMock.activeCommit, acv, commitHash);
    expect(result).to.equal(commit);
  });

  it('should return false if there build did not start before the current build', function () {
    contextVersions[0].build.started = 1;

    var result;
    getCommitForCurrentlyBuildingBuild(instance)
      .then(function (res) {
        result = res;
      });
    $rootScope.$digest();
    sinon.assert.calledOnce(getIncompleteBuidldsForInstanceBranch);
    sinon.assert.calledWith(getIncompleteBuidldsForInstanceBranch, instance, branchName);
    sinon.assert.notCalled(fetchCommitDataMock.activeCommit);
    expect(result).to.equal(false);
  });

  it('should return false if there build did not start before the current build', function () {
    contextVersions.pop();

    var result;
    getCommitForCurrentlyBuildingBuild(instance)
      .then(function (res) {
        result = res;
      });
    $rootScope.$digest();
    sinon.assert.calledOnce(getIncompleteBuidldsForInstanceBranch);
    sinon.assert.calledWith(getIncompleteBuidldsForInstanceBranch, instance, branchName);
    sinon.assert.notCalled(fetchCommitDataMock.activeCommit);
    expect(result).to.equal(false);
  });

});
