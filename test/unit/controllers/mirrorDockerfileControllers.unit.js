/*global runnable:true, mocks: true, directiveTemplate: true, xdescribe: true, before, xit: true */
'use strict';

describe.only('MirrorDockerfileController'.bold.underline.blue, function () {
  var MDC;
  var $controller;
  var $scope;
  var $rootScope;
  var keypather;
  var $q;

  var apiMocks = require('../apiMocks/index');
  var fetchRepoDockerfilesStub;
  var loadingStub;
  var closeModalStub;
  var showModalStub;
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
    opts.branch = (opts.branch !== undefined) ? opts.branch : branch.attrs.name;
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
      $provide.value('loading', function () {
        loadingStub = sinon.stub().returns();
        return loadingStub;
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
    });

    var laterController = $controller('MirrorDockerfileController', {
      $scope: $scope
    }, true);

    laterController.instance.repo = opts.repo;
    laterController.instance.branchName =  opts.branch;

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
      it('should fetch the dockerfile', function () {
        sinon.assert.calledOnce(fetchRepoDockerfilesStub);
        sinon.assert.calledWith(fetchRepoDockerfilesStub, repo.attrs.full_name);
      });
    });

    describe('Success with just repo', function () {
      beforeEach(initState.bind(null, { branch: null }));

      it('should get branch from repo if not provided', function () {
        expect(MDC.repo).to.equal(repo);
        expect(MDC.branchName).to.equal(branch.attrs.name);
      });
    });
  });
  describe('fetchRepoDockerfiles', function () {
    beforeEach(initState.bind(null, {}));

    it('should set loading at the beginning', function () {
      MDC.fetchRepoDockerfiles();
      sinon.assert.calledWith(loadingStub, 'mirrorDockerfile', true);
    });

    it('should fetch the dockerfile', function () {
      sinon.assert.calledOnce(fetchRepoDockerfilesStub);
      sinon.assert.calledWith(fetchRepoDockerfilesStub, repo.attrs.full_name, branch.attrs.name);
    });
  });
});
