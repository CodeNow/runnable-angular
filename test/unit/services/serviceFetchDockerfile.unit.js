/*global runnable:true, user:true, before:true */
'use strict';
var apiMocks = require('../apiMocks');
var instances = apiMocks.instances;
var generateUserObject = apiMocks.generateUserObject;
var generateTeammateInvitationObject = apiMocks.generateTeammateInvitationObject;
var generateGithubUserObject = apiMocks.gh.generateGithubUserObject;
var generateGithubOrgObject = apiMocks.gh.generateGithubOrgObject;

describe('serviceFetchDockerfile'.bold.underline.blue, function () {
  var data;
  var res;
  var $rootScope;
  var $q;
  var base64Mock;
  var promisifyMock;
  var keypather;
  var moment;

  var configAPIHost = 'http://api.runnable.io';
  var $httpStub;
  var httpFactory = function ($q) {
    $httpStub = sinon.stub().returns($q.when({
      data: {}
    }));
    $httpStub.get = sinon.stub().returns($q.when({
      data: {}
    }));
    return $httpStub;
  };

  describe('fetchRepoDockerfile', function () {
    var fetchRepoDockerfile;
    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('$http', httpFactory);
        $provide.value('configAPIHost', configAPIHost);
      });
      angular.mock.inject(function (
        _$q_,
        _$rootScope_,
        _fetchRepoDockerfile_,
        _configAPIHost_
      ) {
        $q = _$q_;
        $rootScope = _$rootScope_;
        fetchRepoDockerfile = _fetchRepoDockerfile_;
        configAPIHost = _configAPIHost_;
      });
    });

    it('should fetch the contents for a file', function () {
      var path = '/Dockerfile';
      var branch = 'staging';
      fetchRepoDockerfile('thejsj/hello', branch, path);
      $rootScope.$digest();
      sinon.assert.calledOnce($httpStub);
      sinon.assert.calledWith($httpStub, {
        method: 'get',
        url: configAPIHost + '/github/repos/thejsj/hello/contents/Dockerfile?ref=staging'
      });
    });

    it('should work when the result is null', function (done) {
      $httpStub.returns($q.when());

      var path = '/Dockerfile';
      var branch = 'staging';
      fetchRepoDockerfile('thejsj/hello', branch, path)
        .then(function (res) {
          sinon.assert.calledOnce($httpStub);
          sinon.assert.calledWith($httpStub, {
            method: 'get',
            url: configAPIHost + '/github/repos/thejsj/hello/contents/Dockerfile?ref=staging'
          });
          expect(res).to.deep.equal(null);
          done();
        });
      $rootScope.$digest();
    });

  });

  describe('fetchRepoDockerfiles', function () {
    var fetchRepoDockerfiles;
    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('$http', httpFactory);
        $provide.value('configAPIHost', configAPIHost);
      });
      angular.mock.inject(function (
        _$q_,
        _$rootScope_,
        _fetchRepoDockerfiles_,
        _configAPIHost_
      ) {
        $q = _$q_;
        $rootScope = _$rootScope_;
        fetchRepoDockerfiles = _fetchRepoDockerfiles_;
        configAPIHost = _configAPIHost_;
      });
    });

    it('should fetch the contents for a file', function () {
      var paths = ['/Dockerfile'];
      var branch = 'staging';
      fetchRepoDockerfiles('thejsj/hello', branch, paths);
      $rootScope.$digest();
      sinon.assert.calledOnce($httpStub);
      sinon.assert.calledWith($httpStub, {
        method: 'get',
        url: configAPIHost + '/github/repos/thejsj/hello/contents/Dockerfile?ref=staging'
      });
    });

    it('should fetch the contents of all given files', function () {
      var paths = ['/Dockerfile', '/asd/asdasd'];
      var branch = 'staging';
      fetchRepoDockerfiles('thejsj/hello', branch, paths);
      $rootScope.$digest();
      sinon.assert.calledTwice($httpStub);
      sinon.assert.calledWith($httpStub, {
        method: 'get',
        url: configAPIHost + '/github/repos/thejsj/hello/contents/Dockerfile?ref=staging'
      });
      sinon.assert.calledWith($httpStub, {
        method: 'get',
        url: configAPIHost + '/github/repos/thejsj/hello/contents/asd/asdasd?ref=staging'
      });
    });

    it('should automatically add a / at the end', function (done) {
      var paths = ['hello/world'];
      $httpStub.returns($q.when({ data: { path: paths[0] }}));

      var branch = 'staging';
      fetchRepoDockerfiles('thejsj/hello', branch, paths)
        .then(function (res) {
          sinon.assert.calledOnce($httpStub);
          sinon.assert.calledWith($httpStub, {
            method: 'get',
            url: configAPIHost + '/github/repos/thejsj/hello/contents/hello/world?ref=staging'
          });
          expect(res).to.have.length(1);
          expect(res[0].path).to.equal('/' + paths[0]);
          done();
        });
      $rootScope.$digest();
    });
  });

  describe('doesDockerfileExist', function () {
    var doesDockerfileExist;
    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('$http', httpFactory);
        $provide.value('configAPIHost', configAPIHost);
      });
      angular.mock.inject(function (
        _$q_,
        _$rootScope_,
        _doesDockerfileExist_,
        _configAPIHost_
      ) {
        $q = _$q_;
        $rootScope = _$rootScope_;
        doesDockerfileExist = _doesDockerfileExist_;
        configAPIHost = _configAPIHost_;
      });
    });
    it('should return false when not found', function () {
      var res = doesDockerfileExist({ message: 'not found' });
      expect(res).to.equal(undefined);
      $rootScope.$digest();
    });
    it('should return false when given null', function () {
      var res = doesDockerfileExist();
      expect(res).to.equal(undefined);
      $rootScope.$digest();
    });
    it('should return false when given null', function () {
      var fakeFile = { data: { path: 'asdasd' }};
      var res = doesDockerfileExist(fakeFile);
      expect(res).to.equal(fakeFile);
      $rootScope.$digest();
    });
  });

  describe('fetchDockerfileForContextVersion', function($q) {
    var doesDockerfileExistStub;
    var fetchDockerfileForContextVersion;
    var fetchRepoDockerfileStub;
    var fetchCommitsForFileStub;
    var dockerfileMock = {
      content: 'this is a dockerfile',
      sha: 'L337'
    }
    var base64Mock = function () {
      return {
        decode: sinon.stub().returns('hello henry')
      }
    };
    var contextVersionMock;
    beforeEach(function() {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('doesDockerfileExist', function ($q) {
            doesDockerfileExistStub = sinon.stub().returns($q.when(dockerfileMock));
            return doesDockerfileExistStub;
        });
        $provide.factory('base64', base64Mock);
        $provide.factory('promisify', function ($q) {
          promisifyMock = sinon.spy(function (obj, key) {
            return function () {
              return $q.when(obj[key].apply(obj, arguments));
            };
          });
          return promisifyMock;
        });
        $provide.factory('base64', base64Mock);
        $provide.factory('fetchRepoDockerfile', function ($q) {
          fetchRepoDockerfileStub = sinon.stub().returns($q.when(dockerfileMock));
          return fetchRepoDockerfileStub;
        });
        $provide.factory('fetchCommitsForFile', function ($q, moment) {
          fetchCommitsForFileStub = sinon.stub().returns($q.when([
            {
              commit: {
                committer: {
                  date: moment().subtract(1, 'months').toISOString()
                }
              }
            }
          ]));
          return fetchCommitsForFileStub;
        });
      });
      angular.mock.inject(function (
        _$q_,
        _$rootScope_,
        _fetchDockerfileForContextVersion_,
        _keypather_,
        _moment_
      ) {
        $q = _$q_;
        $rootScope = _$rootScope_;
        fetchDockerfileForContextVersion = _fetchDockerfileForContextVersion_;
        keypather = _keypather_;
        moment = _moment_;
      });
      contextVersionMock = {
        attrs: {
          buildDockerfilePath: '/Dockerfile'
        },
        getMainAppCodeVersion: sinon.stub().returns({
          attrs: {
            repo: 'testRepo',
            branch: 'testBranch'
          }
        }),
        fetchFile: sinon.stub().returns(function () {return true}),
        newFile: sinon.stub().returns(true)
      };
    });
    it('should determine the correct path for a typical dockerfile', function () {
      fetchDockerfileForContextVersion(contextVersionMock);
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchRepoDockerfileStub);
      sinon.assert.calledWithExactly(fetchRepoDockerfileStub, 'testRepo', 'testBranch', '/Dockerfile');
      sinon.assert.calledOnce(doesDockerfileExistStub);
      sinon.assert.calledOnce(fetchCommitsForFileStub);
      sinon.assert.calledWithExactly(fetchCommitsForFileStub, 'testRepo', 'testBranch', '/Dockerfile');
      sinon.assert.calledOnce(contextVersionMock.newFile);
      sinon.assert.calledWith(contextVersionMock.newFile, {
        _id: dockerfileMock.sha,
        id: dockerfileMock.sha,
        body: 'hello henry',
        isRemoteCopy: true,
        name: 'Dockerfile',
        path: '/',
        lastUpdated: 'a month ago'
      })
    });
    it('should determine the correct path for a dockerfile one directory deep', function () {
      contextVersionMock.attrs.buildDockerfilePath = '/one/Dockerfile'
      fetchDockerfileForContextVersion(contextVersionMock);
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchRepoDockerfileStub);
      sinon.assert.calledWithExactly(fetchRepoDockerfileStub, 'testRepo', 'testBranch', '/one/Dockerfile');
      sinon.assert.calledOnce(doesDockerfileExistStub);
      sinon.assert.calledOnce(fetchCommitsForFileStub);
      sinon.assert.calledWithExactly(fetchCommitsForFileStub, 'testRepo', 'testBranch', '/one/Dockerfile');
      sinon.assert.calledOnce(contextVersionMock.newFile);
      sinon.assert.calledWith(contextVersionMock.newFile, {
        _id: dockerfileMock.sha,
        id: dockerfileMock.sha,
        body: 'hello henry',
        isRemoteCopy: true,
        name: 'Dockerfile',
        path: '/one/',
        lastUpdated: 'a month ago'
      })
    });
    it('should determine the correct path for a dockerfile two directories deep', function () {
      contextVersionMock.attrs.buildDockerfilePath = '/one/two/Dockerfile'
      fetchDockerfileForContextVersion(contextVersionMock);
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchRepoDockerfileStub);
      sinon.assert.calledWithExactly(fetchRepoDockerfileStub, 'testRepo', 'testBranch', '/one/two/Dockerfile');
      sinon.assert.calledOnce(doesDockerfileExistStub);
      sinon.assert.calledOnce(fetchCommitsForFileStub);
      sinon.assert.calledWithExactly(fetchCommitsForFileStub, 'testRepo', 'testBranch', '/one/two/Dockerfile');
      sinon.assert.calledOnce(contextVersionMock.newFile);
      sinon.assert.calledWith(contextVersionMock.newFile, {
        _id: dockerfileMock.sha,
        id: dockerfileMock.sha,
        body: 'hello henry',
        isRemoteCopy: true,
        name: 'Dockerfile',
        path: '/one/two/',
        lastUpdated: 'a month ago'
      })
    });
    it('should determine the correct path for a dockerfile three directories deep', function () {
      contextVersionMock.attrs.buildDockerfilePath = '/one/two/three/Dockerfile'
      fetchDockerfileForContextVersion(contextVersionMock);
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchRepoDockerfileStub);
      sinon.assert.calledWithExactly(fetchRepoDockerfileStub, 'testRepo', 'testBranch', '/one/two/three/Dockerfile');
      sinon.assert.calledOnce(doesDockerfileExistStub);
      sinon.assert.calledOnce(fetchCommitsForFileStub);
      sinon.assert.calledWithExactly(fetchCommitsForFileStub, 'testRepo', 'testBranch', '/one/two/three/Dockerfile');
      sinon.assert.calledOnce(contextVersionMock.newFile);
      sinon.assert.calledWith(contextVersionMock.newFile, {
        _id: dockerfileMock.sha,
        id: dockerfileMock.sha,
        body: 'hello henry',
        isRemoteCopy: true,
        name: 'Dockerfile',
        path: '/one/two/three/',
        lastUpdated: 'a month ago'
      })
    });
    it('should throw an error if the dockerfile path is not valid', function () {
      contextVersionMock.attrs.buildDockerfilePath = 'Dockerfile'
      var error;
      var err;
      fetchDockerfileForContextVersion(contextVersionMock)
        .catch(function(err) {
          error = err;
        })
      $rootScope.$digest();
      sinon.assert.notCalled(fetchRepoDockerfileStub);
      expect(error.message).to.equal('Dockerfile path is invalid');
    });
    it('should throw an error if the dockerfile cannot be retrieved from the repo', function () {
      doesDockerfileExistStub.returns($q.when(null));
      var error;
      fetchDockerfileForContextVersion(contextVersionMock)
        .catch(function(err) {
          error = err;
        });
      $rootScope.$digest();
      sinon.assert.calledOnce(fetchRepoDockerfileStub);
      sinon.assert.calledWithExactly(fetchRepoDockerfileStub, 'testRepo', 'testBranch', '/Dockerfile');
      expect(error.message).to.equal('No Dockerfile in this repo');
    });
  });

  describe('fetchCommitsForFile', function () {
    var fetchCommitsForFile;
    beforeEach(function () {
      angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('$http', httpFactory);
        $provide.value('configAPIHost', configAPIHost);
      });
      angular.mock.inject(function (
        _$rootScope_,
        _fetchCommitsForFile_,
        _configAPIHost_
      ) {
        $rootScope = _$rootScope_;
        fetchCommitsForFile = _fetchCommitsForFile_;
        configAPIHost = _configAPIHost_;
      });
    });

    it('should fetch the commits for a branch at a specific path', function () {
      var path = '/Dockerfile';
      var branch = 'staging';
      fetchCommitsForFile('thejsj/hello', branch, path);
      $rootScope.$digest();
      sinon.assert.calledOnce($httpStub.get);
      sinon.assert.calledWith($httpStub.get, configAPIHost + '/github/repos/thejsj/hello/commits', {
        sha: branch,
        path: path
      });
    });

    it('should default to master if no branch is passed', function () {
      var path = '/Dockerfile';
      fetchCommitsForFile('thejsj/hello', null, path);
      $rootScope.$digest();
      sinon.assert.calledOnce($httpStub.get);
      sinon.assert.calledWith($httpStub.get, configAPIHost + '/github/repos/thejsj/hello/commits', {
        sha: 'master',
        path: path
      });
    });
  });
});
