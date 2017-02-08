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
  var fetchStackAnalysisMock;
  var updateDockerfileFromStateStub;
  var populateDockerfileStub;
  var fetchDockerfileFromSourceStub;
  var fetchInstancesByPodStub;
  var isRunnabotPartOfOrgStub;
  var closeSpy;
  var showModalStub;
  var closeModalStub;
  var eventTrackingStub;
  var createAndBuildNewContainerMock;

  var instanceName = 'HelloWorldInstanceName';
  var branches;
  var repo;
  var analysisMockData;
  var newBuild;
  var mainACV;
  var branch;
  var instances;
  var mockInstance;
  var loadingPromiseMock;
  var loadingPromiseFinishedValue;
  var errsMock;
  var openItemsMock;

  function initState (opts, done) {
    opts = opts || {};
    opts.repo = (opts.repo !== undefined) ? opts.repo : repo;
    opts.build = (opts.build !== undefined) ? opts.build : newBuild;
    opts.masterBranch = (opts.masterBranch !== undefined) ? opts.masterBranch: branch;

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
      $provide.factory('fetchUser', mockUserFetch.autoTrigger(org1));
      $provide.factory('eventTracking', function ($q) {
        eventTrackingStub = {
          createdRepoContainer: sinon.stub(),
          updateCurrentPersonProfile: sinon.stub()
        };
        return eventTrackingStub;
      });
      $provide.factory('fetchInstancesByPod', function ($q) {
        fetchInstancesByPodStub = sinon.stub().returns($q.when(instances));
        return fetchInstancesByPodStub;
      });
      $provide.factory('updateDockerfileFromState', function ($q) {
        updateDockerfileFromStateStub = sinon.stub().returns($q.when(dockerfile));
        return updateDockerfileFromStateStub;
      });
      $provide.factory('isRunnabotPartOfOrg', function ($q) {
        isRunnabotPartOfOrgStub = sinon.stub().returns($q.when());
        return isRunnabotPartOfOrgStub;
      });
      $provide.factory('createAndBuildNewContainer', createAndBuildNewContainerMock.fetch());
      $provide.factory('repositoryFormDirective', function () {
        return {
          priority: 100000,
          link: angular.noop
        };
      });
      $provide.factory('OpenItems', function ($q) {
        openItemsMock = function () {
          this.models = [];
          this.add = sinon.stub();
          this.remove = sinon.stub();
          this.updateAllFiles = sinon.stub().returns($q.when(true));
          this.removeAndReopen = sinon.stub();
        };
        return openItemsMock;
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
      $rootScope.featureFlags = {};
      SMC = $controller('SetupMirrorServerModalController', {
        $scope: $scope,
        instanceName: opts.instanceName || instanceName,
        repo: opts.repo || null,
        build: opts.build || null,
        masterBranch: opts.masterBranch || null
      });
    });
    return done();
  }
  function initializeValues() {
    // Set variables for initial state
    branch = {
      attrs: {
        name: 'master',
        commit: {
          sha: 'sha'
        }
      }
    };
    branches = {
      models: [branch]
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
      dockerfiles: [
        {
          sha: '123',
          content: btoa('Hello World')
        }
      ],
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
        branch: branch.attrs.name
      },
      create: sinon.stub().callsArg(1),
      update: sinon.spy(function (opts, cb) {
        $rootScope.$evalAsync(function () {
          cb(null, mainACV);
        });
        return mainACV;
      })
    };
    newBuild = {
      contextVersion: {
        id: 'foo',
        attrs: {
          buildDockerfilePath: '/Dockerfile'
        },
        getMainAppCodeVersion: sinon.stub().returns(mainACV),
        appCodeVersions: [mainACV],
        newFile: sinon.stub().returns(repo.dockerfiles[0]),
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

    mockInstance = {
      build: newBuild,
      contextVersion: {
        attrs: {
          asdfasdf: 'asdfasdf'
        }
      },
      attrs: {
        isTesting: false,
        contextVersion: {
          context: 'context1234'
        },
        owner: {
          username: 'orgName'
        },
        env: ['HELLO=WORLD']
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
    describe('Errors', function () {
      it('should fail if no repo is passed', function () {
        expect(function () {
          initState({ repo: null }, angular.noop);
          $scope.$digest();
        }).to.throw();
      });

      it('should fail if no buildDockerfilePath is passed', function () {
        newBuild.contextVersion.attrs.buildDockerfilePath = null;
        expect(function () {
          initState({}, angular.noop);
          $scope.$digest();
        }).to.throw();
      });
    });

    describe('Success Cases', function () {
      beforeEach(initState.bind(null, {}));

      it('should set the repo, be advanced, and have selected repo', function () {
        expect(SMC.state.repo).to.exist;
        expect(SMC.state.build).to.exist;
        expect(SMC.state.acv).to.exist;
        expect(SMC.state.contextVersion).to.exist;
        expect(SMC.state.branch).to.exist;
        expect(SMC.state.advanced).to.equal('isMirroringDockerfile');
        expect(SMC.state.repoSelected).to.equal(true);
      });
    });
  });

  describe('showStackSelector', function () {
    beforeEach(initState.bind(null, {}));

    it('should equal false', function () {
      expect(SMC.showStackSelector()).to.equal(false);
    });
  });

  describe('rebuild', function () {
    var cv = {};
    beforeEach(initState.bind(null, {}));
    beforeEach(function () {
      keypather.set(SMC, 'instance.contextVersion', cv);
      SMC.rebuildAndOrRedeploy = sinon.stub().returns($q.when(true));
      SMC.resetStateContextVersion = sinon.stub().returns($q.when(true));
    });
    it('should rebuildAndOrRedeploy', function () {
      $scope.$digest();
      SMC.rebuild(true, true);
      $scope.$digest();
      sinon.assert.calledOnce(SMC.rebuildAndOrRedeploy);
      sinon.assert.calledWith(SMC.rebuildAndOrRedeploy, true, true);
    });

    it('should reset the context version', function () {
      $scope.$digest();
      SMC.rebuild(true, true);
      $scope.$digest();
      sinon.assert.calledOnce(SMC.resetStateContextVersion);
      sinon.assert.calledWith(SMC.resetStateContextVersion, cv, true);
    });

    it('should handle errors', function () {
      SMC.rebuildAndOrRedeploy.returns($q.reject(new Error('Hello')));

      $scope.$digest();
      SMC.rebuild(true, true);
      $scope.$digest();
      sinon.assert.calledOnce(SMC.rebuildAndOrRedeploy);
      sinon.assert.notCalled(SMC.resetStateContextVersion);
      sinon.assert.calledOnce(errsMock.handler);
    });
  });

  describe('createServer', function () {
    var opts = {};
    beforeEach(initState.bind(null, {}));
    beforeEach(function () {
      SMC.state.repo = repo;
      SMC.state.branch = branch;
      SMC.state.build = newBuild;
      SMC.state.contextVersion = newBuild.contextVersion;
      SMC.state.acv = mainACV;
      SMC.resetStateContextVersion = sinon.stub().returns($q.when(true));
    });

    it('should update the branch if not the same branch', function () {
      SMC.state.branch.attrs.name = 'anotherName';
      SMC.createServer();
      $scope.$digest();
      sinon.assert.calledOnce(mainACV.update);
      sinon.assert.calledWith(mainACV.update, {
        repo: repo.attrs.full_name,
        branch: branch.attrs.name,
        commit: branch.attrs.commit.sha
      });
    });

    it('should not update the branch if its the same branch', function () {
      SMC.createServer();
      $scope.$digest();
      sinon.assert.notCalled(mainACV.update);
    });

    it('should createAndBuildNewContainer', function () {
      SMC.createServer();
      $scope.$digest();
      sinon.assert.calledOnce(createAndBuildNewContainerMock.getFetchSpy());
      sinon.assert.calledWith(
        createAndBuildNewContainerMock.getFetchSpy(),
        sinon.match.any,
        instanceName
      );
    });

    it('should set the instance and opts', function () {
      SMC.createServer();
      $scope.$digest();
      createAndBuildNewContainerMock.triggerPromise(mockInstance);
      $scope.$digest();
      expect(SMC.instance).to.equal(mockInstance);
      expect(SMC.state.instance).to.equal(mockInstance);
      expect(SMC.state.opts).to.deep.equal({
        env: ['HELLO=WORLD'],
        ipWhitelist: {
          enabled: false
        },
        isTesting: false
      });
    });

    it('should throw an error if no instance is created', function (done) {
      SMC.createServer()
        .then(done.bind(null, new Error('This should not happen')))
        .catch(function (err)  {
          expect(err.message).to.match(/instance.*not.*created.*properly/i);
          return done();
        });
      $scope.$digest();
      createAndBuildNewContainerMock.triggerPromise(null);
      $scope.$digest();
      sinon.assert.calledOnce(SMC.resetStateContextVersion);
    });

    it('should reset the context version if it succeeds', function () {
      SMC.createServer();
      $scope.$digest();
      createAndBuildNewContainerMock.triggerPromise(mockInstance);
      $scope.$digest();
      sinon.assert.calledOnce(SMC.resetStateContextVersion);
      sinon.assert.calledWith(SMC.resetStateContextVersion, mockInstance.contextVersion, true);
    });

    it('should reset the context version if it fails', function () {
      SMC.createServer();
      $scope.$digest();
      createAndBuildNewContainerMock.triggerPromise($q.reject(new Error('Super Error')));
      $scope.$digest();
      sinon.assert.calledOnce(SMC.resetStateContextVersion);
      sinon.assert.calledWith(SMC.resetStateContextVersion, newBuild.contextVersion, false);
    });
  });

  describe('isTabVisible', function () {
    beforeEach(initState.bind(null, {}));

    it('should return false if tab doesn\'t exist', function () {
      expect(SMC.isTabVisible('asdfasd')).to.equal(false);
    });

    it('should return false if in mirror mode', function () {
      SMC.state.advanced = 'isMirroringDockerfile';
      expect(SMC.isTabVisible('buildfiles')).to.equal(true);
      expect(SMC.isTabVisible('translation')).to.equal(false);
      expect(SMC.isTabVisible('files')).to.equal(false);
    });

    it('should return true if in advanced mode', function () {
      SMC.state.advanced = true;
      expect(SMC.isTabVisible('buildfiles')).to.equal(true);
      expect(SMC.isTabVisible('translation')).to.equal(true);
      expect(SMC.isTabVisible('files')).to.equal(false);
    });
  });

  describe('isPrimaryButtonDisabled', function () {
    beforeEach(initState.bind(null, {}));

    it('should equal true if there is no repository form', function () {
      SMC.repositoryForm = null;
      expect(SMC.isPrimaryButtonDisabled()).to.equal(false);
    });

    it('should equal true if repository form is valid', function () {
      SMC.repositoryForm = { $invalid: false };
      expect(SMC.isPrimaryButtonDisabled()).to.equal(false);
    });

    it('should equal false if repository form is invalid', function () {
      SMC.repositoryForm = { $invalid: true };
      expect(SMC.isPrimaryButtonDisabled()).to.equal(true);
    });
  });

  describe('needsToBeDirtySaved', function () {
    beforeEach(initState.bind(null, {}));

    it('should return true if there is a an instance', function () {
      SMC.instance = {};
      expect(SMC.needsToBeDirtySaved()).to.equal(true);
    });

    it('should return false if there is no instance', function () {
      SMC.instance = null;
      expect(SMC.needsToBeDirtySaved()).to.equal(false);
    });
  });

  describe('$on resetStateContextVersion', function () {
    beforeEach(initState.bind(null, {}));
    beforeEach(function () {
      SMC.resetStateContextVersion = sinon.stub().returns($q.when(true));
    });

    it('should load if it should show the spinner', function () {
      $scope.$digest();
      $scope.$emit('resetStateContextVersion', SMC.state.contextVersion, true);
      expect($rootScope.isLoading.setupMirrorServerModal).to.equal(true);
      $scope.$digest();
      $scope.$digest();
      expect($rootScope.isLoading.setupMirrorServerModal).to.equal(false);
    });

    it('should not load if it should show not the spinner', function () {
      $scope.$emit('resetStateContextVersion', SMC.state.contextVersion, false);
      $scope.$digest();
      expect($rootScope.isLoading.setupMirrorServerModal).to.equal(false);
    });

    it('should reset the context version', function () {
      $scope.$emit('resetStateContextVersion', SMC.state.contextVersion, true);
      $scope.$digest();
      sinon.assert.calledOnce(SMC.resetStateContextVersion);
      sinon.assert.notCalled(errsMock.handler);
    });

    it('should handle errors', function () {
      SMC.resetStateContextVersion.returns($q.reject(true));

      $scope.$emit('resetStateContextVersion', SMC.state.contextVersion, true);
      $scope.$digest();
      sinon.assert.calledOnce(SMC.resetStateContextVersion);
      sinon.assert.calledOnce(errsMock.handler);
    });
  });

  describe('changing the branch should change dockerfile', function () {
    beforeEach(initState.bind(null, {}));
    it('should call openDockerfile if the ACV event is emitted', function () {
      SMC.openDockerfile = sinon.stub();
      $scope.$emit('updatedACV');
      $scope.$digest();
      sinon.assert.calledOnce(SMC.openDockerfile);
    });
  });
});

