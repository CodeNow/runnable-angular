/*global runnable:true, mocks: true, directiveTemplate: true, xdescribe: true, before, xit: true */
'use strict';

describe('MirrorDockerfileController'.bold.underline.blue, function () {
  var CDMC;
  var $controller;
  var $scope;
  var $rootScope;
  var keypather;
  var $q;

  var apiMocks = require('../apiMocks/index');
  var fetchRepoDockerfilesStub;

  var dockerfile = {
    state: {
      type: 'File',
      body: angular.copy(apiMocks.files.dockerfile)
    },
    attrs: {
      body: angular.copy(apiMocks.files.dockerfile)
    }
  };
  var repo;
  var branch;
  var branches;
  var closeSpy;

  function initState(opts, done) {
    opts.repo = (opts.repo !== undefined) ? opts.repo : repo;
    opts.repoFullName = (opts.repoFullName !== undefined) ? opts.repo : repo.attrs.full_name;

    angular.mock.module('app');
      angular.mock.module(function ($provide) {
        $provide.factory('fetchRepoDockerfiles', function ($q) {
          fetchRepoDockerfilesStub = sinon.stub().returns($q.when([ dockerfile ]));
          return fetchRepoDockerfilesStub;
        });
        $provide.factory('fetchRepoDockerfile', function ($q) {
          fetchRepoDockerfilesStub = sinon.stub().returns($q.when(dockerfile));
          return fetchRepoDockerfilesStub;
        });
        closeSpy = sinon.stub();
        $provide.value('close', closeSpy);
     });

    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _keypather_,
      _$q_
    ) {
      $controller = _$controller_;
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      $q = _$q_;

     $scope = $rootScope.$new();
      CDMC = $controller('ChooseDockerfileModalController', {
        $scope: $scope,
        repo: opts.repo,
        branchName: branch.attrs.name
      });
    });
    return done();
  }
  function initializeValues() {
    // Set variables for initial state
    branch = {
      attrs: {
        name: 'branchName',
        commit: {
          sha: 'sha'
        }
      }
    };
    branches = {
      models: [ branch  ]
    };
    repo = {
      attrs: {
        name: 'fooo',
        full_name: 'foo',
        default_branch: 'master',
        owner: {
          login: 'bar'
        }
      },
      opts: {
        userContentDomain: 'runnable-test.com'
      },
      fetchBranch: sinon.spy(function (opts, cb) {
        $rootScope.$evalAsync(function () {
          cb(null, branches.models[0]);
        });
        return branches.models[0];
      }),
      newBranch: sinon.spy(function (opts) {
        repo.fakeBranch = {
          attrs: {
            name: opts
          },
          fetch: sinon.spy(function (cb) {
            $rootScope.$evalAsync(function () {
              cb(null, repo.fakeBranch);
            });
            return repo.fakeBranch;
          })
        };
        return repo.fakeBranch;
      })
    };
  }
  beforeEach(initializeValues);

  describe('Init', function () {
    describe('Errors', function () {
      it('should fail if no repo is passed', function () {
        expect(function () {
          initState({ repo: null }, angular.noop);
          $scope.$digest();
        }).to.throw();
      });
    });
    describe('Success', function () {
      beforeEach(initState.bind(null, {}));

      it('should set the repo to the state', function () {
         expect(CDMC.state.repo).to.equal(repo);
      });

      it('should fetch the dockerfile', function () {
        sinon.assert.calledOnce(fetchRepoDockerfilesStub);
        sinon.assert.calledWith(fetchRepoDockerfilesStub, repo.attrs.full_name);
      });
    });
  });

  describe('Canel', function () {
    beforeEach(initState.bind(null, {}));

    it('should close the modal when canceled', function () {
      CDMC.cancel();
      sinon.assert.calledOnce(closeSpy);
    });
  });

  describe('Confirm', function () {
    beforeEach(initState.bind(null, {}));

    it('should close the modal when canceled', function () {
      CDMC.confirm(dockerfile);
      sinon.assert.calledOnce(closeSpy);
      sinon.assert.calledWith(closeSpy, dockerfile);
    });

    it('should close the modal when canceled', function () {
      expect(CDMC.confirm.bind(CDMC, null)).to.throw();
    });
  });
});
