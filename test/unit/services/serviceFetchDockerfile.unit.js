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
      var path = '/Dockerfile';
      var branch = 'staging';
      fetchRepoDockerfiles('thejsj/hello', branch, path);
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
      fetchRepoDockerfiles('thejsj/hello', branch, path)
        .then(function (res) {
          sinon.assert.calledOnce($httpStub);
          sinon.assert.calledWith($httpStub, {
            method: 'get',
            url: configAPIHost + '/github/repos/thejsj/hello/contents/Dockerfile?ref=staging'
          });
          expect(res).to.deep.equal(undefined);
          done();
        });
      $rootScope.$digest();
    });

    it('should automatically add a / at the end', function () {
      var path = 'hello/world';
      $httpStub.returns($q.when({ data: { path: path }}));

      var branch = 'staging';
      var res;
      fetchRepoDockerfiles('thejsj/hello', branch, path)
        .then(function (_res) {
          res = _res;
        });
      $rootScope.$digest();
      sinon.assert.calledOnce($httpStub);
      sinon.assert.calledWith($httpStub, {
        method: 'get',
        url: configAPIHost + '/github/repos/thejsj/hello/contents/Dockerfile?ref=staging'
      });
      expect(res).to.have.lengthOf(1);
      expect(res[0].path).to.equal('/' + path);
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
      var path = '/Dockerfile';
      var branch = 'staging';
      fetchRepoDockerfiles('thejsj/hello', branch, path);
      $rootScope.$digest();
      sinon.assert.calledOnce($httpStub);
      sinon.assert.calledWith($httpStub, {
        method: 'get',
        url: configAPIHost + '/github/repos/thejsj/hello/contents/Dockerfile?ref=staging'
      });
    });

    it('should return an empty list if nothing is found', function () {
      $httpStub.returns($q.when({ data: { message: 'not found' }}));

      var path = '/Dockerfile';
      var branch = 'staging';
      var res;
      fetchRepoDockerfiles('thejsj/hello', branch, path)
        .then(function (_res) {
          res = _res;
        });
      $rootScope.$digest();
      sinon.assert.calledOnce($httpStub);
      sinon.assert.calledWith($httpStub, {
        method: 'get',
        url: configAPIHost + '/github/repos/thejsj/hello/contents/Dockerfile?ref=staging'
      });
      expect(res).to.deep.equal([]);
    });

    it('should automatically add a / at the end', function () {
      var path = 'hello/world';
      $httpStub.returns($q.when({ data: { path: path }}));

      var branch = 'staging';
      var res;
      fetchRepoDockerfiles('thejsj/hello', branch, path)
        .then(function (_res) {
          res = _res;
        });
      $rootScope.$digest();
      sinon.assert.calledOnce($httpStub);
      sinon.assert.calledWith($httpStub, {
        method: 'get',
        url: configAPIHost + '/github/repos/thejsj/hello/contents/Dockerfile?ref=staging'
      });
      expect(res).to.have.lengthOf(1);
      expect(res[0].path).to.equal('/' + path);
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
