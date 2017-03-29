/*global runnable:true, mocks: true, directiveTemplate: true, xdescribe: true, before, xit: true */
'use strict';

describe('MirrorDockerfileController'.bold.underline.blue, function () {
  var MDC;
  var $controller;
  var $scope;
  var $rootScope;
  var keypather;
  var $q;

  var apiMocks = require('../apiMocks/index');
  var fetchRepoDockerfilesStub;
  var closeModalStub;
  var showModalStub;
  var dockerfile;
  var dockerComposeFile;
  var repo;
  var branch;
  var branches;
  var closeSpy;

  function initState(opts, done) {
    opts.repo = (opts.repo !== undefined) ? opts.repo : repo;
    opts.branch = (opts.branch !== undefined) ? opts.branch : branch.attrs.name;
    opts.repoFullName = (opts.repoFullName !== undefined) ? opts.repo : repo.attrs.full_name;

    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.factory('fetchRepoDockerfile', function ($q) {
        fetchRepoDockerfilesStub = sinon.stub().returns($q.when(dockerfile));
        return fetchRepoDockerfilesStub;
      });
      $provide.factory('ModalService', function ($q) {
        closeModalStub = {
          close: $q.when(true)
        };
        showModalStub = sinon.spy(function () {
          return $q.when(closeModalStub);
        });
        return {
          showModal: showModalStub
        };
      });
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
    });

    var laterController = $controller('MirrorDockerfileController', {
      $scope: $scope
    }, true);

    laterController.instance.repo = opts.repo;
    laterController.instance.branchName =  opts.branch;
    laterController.instance.state =  opts.state || {};

    MDC = laterController();
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
    dockerfile = {
      state: {
        type: 'File',
        body: angular.copy(apiMocks.files.dockerfile)
      },
      path: '/Dockerfile',
      attrs: {
        body: angular.copy(apiMocks.files.dockerfile)
      }
    };
    dockerComposeFile = {
      state: {
        type: 'File',
        body: angular.copy(apiMocks.files.dockerfile)
      },
      path: '/Dockerfile',
      attrs: {
        body: angular.copy(apiMocks.files.dockerfile)
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
    describe('Success with both repo and branch', function () {
      beforeEach(initState.bind(null, {}));

      it('should set the repo and branchName to the controller', function () {
        expect(MDC.repo).to.equal(repo);
        expect(MDC.branchName).to.equal(branch.attrs.name);
      });
    });

  });

  describe('fetchRepoDockerfiles', function () {
    describe('fetching with just repo', function () {
      beforeEach(initState.bind(null, {branch: null}));

      it('should get branch from repo if not provided', function () {
        MDC.fetchRepoDockerfiles();
        $scope.$digest();
        sinon.assert.calledOnce(fetchRepoDockerfilesStub);
        sinon.assert.calledWith(fetchRepoDockerfilesStub, repo.attrs.full_name, repo.attrs.default_branch);
      });
    });
    describe('fetching with both branch and repo', function () {
      beforeEach(initState.bind(null, {}));

      it('should fetch the dockerfile', function () {
        MDC.fetchRepoDockerfiles();
        $scope.$digest();

        sinon.assert.calledOnce(fetchRepoDockerfilesStub);
        sinon.assert.calledWith(fetchRepoDockerfilesStub, repo.attrs.full_name, branch.attrs.name);
      });

      it('should fill the state.repo with the dockerfile', function () {
        MDC.fetchRepoDockerfiles();
        $scope.$digest();

        expect(MDC.newDockerfilePaths).to.deep.equal([dockerfile.path]);
        expect(MDC.repo.dockerfiles).to.deep.equal([dockerfile]);
      });
    });
  });
  describe('fetchRepoDockerComposefiles', function () {
    describe('fetching with just repo', function () {
      beforeEach(initState.bind(null, {branch: null}));

      it('should get branch from repo if not provided', function () {
        MDC.fetchRepoDockerComposeFiles();
        $scope.$digest();
        sinon.assert.calledOnce(fetchRepoDockerfilesStub);
        sinon.assert.calledWith(fetchRepoDockerfilesStub, repo.attrs.full_name, repo.attrs.default_branch);
      });
    });
  });
  describe('addDockerfileFromPath', function () {
    beforeEach(initState.bind(null, {}));
    beforeEach(function () {
      sinon.stub(MDC, 'fetchRepoDockerfiles').returns($q.when([dockerfile]));
    });
    
  });
  describe('fetchRepoDockerComposefiles', function () {
    describe('fetching with just repo', function () {
      beforeEach(initState.bind(null, {branch: null}));

      it('should get branch from repo if not provided', function () {
        MDC.fetchRepoDockerComposeFiles();
        $scope.$digest();
        sinon.assert.calledOnce(fetchRepoDockerfilesStub);
        sinon.assert.calledWith(fetchRepoDockerfilesStub, repo.attrs.full_name, repo.attrs.default_branch);
      });
    });
  });
  describe('addDockerComposeFileFromPath', function () {
    beforeEach(initState.bind(null, {}));
    beforeEach(function () {
      sinon.stub(MDC, 'fetchRepoDockerComposeFiles').returns($q.when([dockerfile]));
    });
    
  });
});
