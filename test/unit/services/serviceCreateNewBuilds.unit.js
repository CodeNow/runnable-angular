'use strict';
var apiMocks = require('../apiMocks/index');
var keypather = require('keypather')();

describe('serviceCreateNewBuildAndFetchBranch'.bold.underline.blue, function () {
  var $rootScope;
  var $q;
  var createNewBuildAndFetchBranch;

  var fetchStackDataStub;
  var createNewBuildStub;
  var createDockerfileFromSourceStub;
  var errsStub;
  var stacks = [];
  var file = {};
  var build = {
    contextVersion:  {
      appCodeVersions: {
        create: sinon.spy(function (name, cb) {
          return masterBranch;
        })
      }
    }
  };
  var masterBranch = {
    attrs: {
      name: 'master',
      commit: {
        sha: '123'
      }
    }
  };
  var repo = {
    attrs: {
      default_branch: 'master',
      full_name: 'RepoName'
    },
    fetchBranch: sinon.spy(function (name, cb) {
      return masterBranch;
    })
  };

  function initState () {
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.factory('createNewBuild', function ($q, $rootScope) {
        createNewBuildStub = sinon.stub().returns($q.when(build));
        return createNewBuildStub;
      });
      $provide.factory('fetchStackData', function ($q, $rootScope) {
        fetchStackDataStub = sinon.stub().returns($q.when(stacks));
        return fetchStackDataStub;
      });
      $provide.factory('createDockerfileFromSource', function ($q, $rootScope) {
        createDockerfileFromSourceStub = sinon.stub().returns($q.when(file));
        return createDockerfileFromSourceStub;
      });
      $provide.factory('promisify', function ($q) {
        return function (obj, key) {
          return function () {
            return $q.when(obj[key].apply(this, arguments));
          };
        };
      });
     $provide.factory('errs', function () {
        errsStub = {
          handler: sinon.stub()
        };
        return errsStub;
      });

    });
    angular.mock.inject(function (
      _$rootScope_,
      _$q_,
      _createNewBuildAndFetchBranch_
    ) {
      $rootScope = _$rootScope_;
      $q = _$q_;
      createNewBuildAndFetchBranch = _createNewBuildAndFetchBranch_;
    });
  }
  beforeEach(initState);

  it('should fetchStackData', function () {
    createNewBuildAndFetchBranch({}, repo);
    $rootScope.$digest();
    sinon.assert.calledOnce(fetchStackDataStub);
    sinon.assert.calledOnce(createNewBuildStub);
    sinon.assert.calledOnce(repo.fetchBranch);
  });

  it('should return the inputs', function () {
    createNewBuildAndFetchBranch({}, repo)
      .then(function (inputs) {
        expect(inputs.repo).to.equal(repo);
        expect(inputs.masterBranch).to.equal(masterBranch);
        expect(inputs.build).to.equal(build);
      });
    $rootScope.$digest();
  });

  it('should throw an error if it cant fetch the repo', function () {
    fetchStackDataStub.returns($q.reject(new Error('repo not found')));

    var promise = createNewBuildAndFetchBranch({}, repo);
    $rootScope.$digest();
    expect(promise).to.be.rejected;
    expect(promise).to.eventually.match({
      message: sinon.match(/failed.*to.*add.*webhooks/i)
    });
  });

  it('should throw the error there is any other error', function () {
    fetchStackDataStub.returns($q.reject(new Error('normal error')));

    var promise = createNewBuildAndFetchBranch({}, repo);
    $rootScope.$digest();
    expect(promise).to.be.rejected;
    expect(promise).to.eventually.match({
      message: sinon.match(/normal.*error/i)
    });
  });

  it('createDockerfileFromSource', function () {
    it('should create a Dockerfile if there is no source', function () {
       createNewBuildAndFetchBranch({}, repo)
        .then(function (inputs) {
          sinon.assert.calledOnce(createDockerfileFromSourceStub);
          sinon.assert.calledWith(createDockerfileFromSourceStub, sinon.match.object, 'blank');
        });
        $rootScope.$digest();
    });

    it('should not create a Dockerfile if there is a source', function () {
      build.contextVersion.source = {};

      createNewBuildAndFetchBranch({}, repo)
        .then(function (inputs) {
          sinon.assert.notCalled(createDockerfileFromSourceStub);
        });
        $rootScope.$digest();
    });
  });

});
