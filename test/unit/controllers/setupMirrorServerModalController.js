/*global runnable:true, mocks: true, directiveTemplate: true, xdescribe: true, before, xit: true */
'use strict';

describe('setupMirrorServerModalController'.bold.underline.blue, function () {
  var SMC;
  var $controller;
  var $scope;
  var $rootScope;
  var keypather;
  var loadingPromises;
  var $q;
  var featureFlags;
  var MockFetch = require('../fixtures/mockFetch');
  var mockUserFetch = new (require('../fixtures/mockFetch'))();
  var apiMocks = require('../apiMocks/index');
  var apiClientMockFactory = require('../../unit/apiMocks/apiClientMockFactory');
  var VersionFileModel = require('@runnable/api-client/lib/models/context/version/file');
  var fileObj = {'path':'/home','name':'defined','isDir':false,'body':'adsf','state':{'from':'File'}};
  var fileModel = new VersionFileModel(fileObj, { noStore: true });

  var stacks = angular.copy(apiMocks.stackInfo);
  var dockerfile = {
    state: {
      type: 'File',
      body: angular.copy(apiMocks.files.dockerfile)
    },
    attrs: {
      body: angular.copy(apiMocks.files.dockerfile)
    }
  };
  var org1 = {
    attrs: angular.copy(apiMocks.user),
    oauthName: function () {
      return 'org1';
    },
    oauthId: function () {
      return 'org1';
    }
  };
  var createNewBuildMock;

  var fetchOwnerRepoStub;
  var fetchUserStub;
  var fetchStackAnalysisMock;
  var updateDockerfileFromStateStub;
  var populateDockerfileStub;
  var fetchDockerfileFromSourceStub;
  var fetchInstancesByPodStub;
  var closeSpy;
  var showModalStub;
  var closeModalStub;
  var createAndBuildNewContainerMock;
  var helpCardsMock;

  var branches;
  var repo;
  var analysisMockData;
  var newBuild;
  var mainACV;
  var acv;
  var branch;
  var instances;
  var mockInstance;
  var loadingPromiseMock;
  var loadingPromiseFinishedValue;
  var errsMock;

  function initState(opts, done) {
    helpCardsMock = {
      refreshAllCards: sinon.stub()
    };
    errsMock = {
      handler: sinon.spy()
    };

    fetchStackAnalysisMock = new MockFetch();
    createNewBuildMock = sinon.stub();
    populateDockerfileStub = sinon.stub();
    createAndBuildNewContainerMock = new MockFetch();
    loadingPromiseFinishedValue = null;

    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('errs', errsMock);
      $provide.factory('fetchStackAnalysis', fetchStackAnalysisMock.fetch());
      $provide.value('helpCards', helpCardsMock);
      $provide.factory('fetchUser', mockUserFetch.autoTrigger(org1));
      $provide.factory('fetchInstancesByPod', function ($q) {
        fetchInstancesByPodStub = sinon.stub().returns($q.when(instances));
        return fetchInstancesByPodStub;
      });
      $provide.factory('updateDockerfileFromState', function ($q) {
        updateDockerfileFromStateStub = sinon.stub().returns($q.when(dockerfile));
        return updateDockerfileFromStateStub;
      });
      $provide.factory('createAndBuildNewContainer', createAndBuildNewContainerMock.fetch());
      $provide.factory('repositoryFormDirective', function () {
        return {
          priority: 100000,
          link: angular.noop
        };
      });
      $provide.factory('fetchStackInfo', function ($q) {
        return function () {
          return $q.when(stacks);
        };
      });
      $provide.factory('stackSelectorFormDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
      $provide.factory('branchSelectorDirective', function () {
        return {
          priority: 100000,
          link: angular.noop
        };
      });

      closeSpy = sinon.stub();

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

      $provide.value('close', closeSpy);

      $provide.value('actions', {});
      $provide.factory('fetchDockerfileFromSource', function ($q) {
        fetchDockerfileFromSourceStub = sinon.stub().returns($q.when(dockerfile));
        return fetchDockerfileFromSourceStub;
      });
      $provide.factory('loadingPromises', function ($q) {
        loadingPromiseMock = {
          add: sinon.stub().returnsArg(1),
          clear: sinon.spy(),
          start: sinon.stub().returnsArg(1),
          count: sinon.stub().returns(0),
          finished: sinon.spy(function () {
            return $q.when(loadingPromiseFinishedValue);
          })
        };
        return loadingPromiseMock;
      });

      $provide.value('createNewBuild', createNewBuildMock);
      $provide.factory('fetchOwnerRepos', function ($q) {
        runnable.reset(mocks.user);
        fetchOwnerRepoStub = sinon.stub().returns(
          $q.when(
            runnable.newGithubRepos(
              mocks.repoList, {
                noStore: true
              })
          )
        );
        return fetchOwnerRepoStub;
      });
    });

    angular.mock.inject(function (_$controller_,
                                  _$rootScope_,
                                  _keypather_,
                                  _loadingPromises_,
                                  _$q_) {
      $controller = _$controller_;
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      loadingPromises = _loadingPromises_;
      $q = _$q_;

      keypather.set($rootScope, 'dataApp.data.activeAccount.oauthName', sinon.mock().returns('myOauthName'));
      $scope = $rootScope.$new();
      SMC = $controller('SetupServerModalController', {
        $scope: $scope,
        repo: opts.repo || null,
        build: opts.build || null,
        masterBranch: opts.masterBranch || null
      });
    });
    return done();
  }
  function initializeValues() {
    // Set variables for initial state
    branches = {
      models: [
        {
          attrs: {
            name: 'master',
            commit: {
              sha: 'sha'
            }
          }
        }
      ]
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
    analysisMockData = {
      languageFramework: 'ruby_ror',
      version: {
        rails: '4.1.8',
        ruby: '0.8'
      }
    };
    mainACV = {
      mainACV: true,
      attrs: {
        branch: 'branchName'
      },
      update: sinon.spy(function (opts, cb) {
        $rootScope.$evalAsync(function () {
          cb(null, dockerfile);
        });
        return dockerfile;
      })
    };
    newBuild = {
      contextVersion: {
        id: 'foo',
        attrs: {},
        getMainAppCodeVersion: sinon.stub().returns(mainACV),
        appCodeVersions: {
          create: sinon.stub().callsArg(1)
        },
        fetchFile: sinon.spy(function (fileName, cb) {
          $rootScope.$evalAsync(function () {
            cb(null, dockerfile);
          });
          return dockerfile;
        }),
      },
      attrs: {
        env: []
      }
    };
    acv = {
      attrs: {
        branch: 'branchName'
      }
    };
    branch = {
      attrs: {
        name: 'branchName'
      }
    };

    mockInstance = {
      build: newBuild,
      contextVersion: {
        attrs: {
          asdfasdf: 'asdfasdf'
        }
      },
      attrs: {
        contextVersion: {
          context: 'context1234'
        },
        owner: {
          username: 'orgName'
        }
      },
      getRepoName: sinon.stub().returns('mainRepo'),
      on: sinon.stub()
    };
    instances = [
      mockInstance,
      {
        getRepoName: sinon.stub().returns(mocks.repoList[0].full_name.split('/')[1])
      }, {
        getRepoName: sinon.spy(),
        attrs: {
          name: 'foo'
      }
    }];
  }
  beforeEach(initializeValues);

  describe('Init', function () {
    beforeEach(initState.bind(null, {}));
  });

});
