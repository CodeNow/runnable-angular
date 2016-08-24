/*global runnable:true, mocks: true, directiveTemplate: true, xdescribe: true, before, xit: true */
'use strict';

describe('setupServerModalController'.bold.underline.blue, function () {
  var SMC;
  var $controller;
  var $scope;
  var $rootScope;
  var keypather;
  var $q;
  var MockFetch = require('../fixtures/mockFetch');
  var mockUserFetch = new (require('../fixtures/mockFetch'))();
  var apiMocks = require('../apiMocks/index');

  var stacks = angular.copy(apiMocks.stackInfo);
  var dockerfile = {
    sha: '123',
    content: btoa('Hello World'),
    state: {
      type: 'File',
      body: angular.copy(apiMocks.files.dockerfile)
    },
    attrs: {
      body: angular.copy(apiMocks.files.dockerfile),
      sha: '123',
      content: btoa('Hello World')
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

  var fetchDockerfileForContextVersionStub;
  var fetchRepoDockerfilesStub;
  var fetchStackAnalysisMock;
  var updateDockerfileFromStateStub;
  var fetchDockerfileFromSourceStub;
  var fetchInstancesByPodStub;
  var closeSpy;
  var showModalStub;
  var closeModalStub;
  var createAndBuildNewContainerMock;
  var helpCardsMock;

  var instanceName = 'instanceName';
  var branches;
  var repo;
  var newBuild;
  var mainACV;
  var acv;
  var branch;
  var instances;
  var mockInstance;
  var loadingPromiseMock;
  var loadingPromiseFinishedValue;
  var errsMock;

  var mockServerModalController;

  function initState(opts, replaceSMC, done) {
    helpCardsMock = {
      refreshAllCards: sinon.stub()
    };
    errsMock = {
      handler: sinon.spy()
    };

    var ServerModalController = function () {
      this.closeWithConfirmation = sinon.spy();
      this.changeTab = sinon.spy();
      this.disableMirrorMode = sinon.spy();
      this.enableMirrorMode = sinon.spy();
      this.getDisplayName = sinon.spy();
      this.getElasticHostname = sinon.spy();
      this.getNumberOfOpenTabs = sinon.spy();
      this.getUpdatePromise = sinon.spy();
      this.insertHostName = sinon.spy();
      this.isDirty = sinon.spy();
      this.openDockerfile = sinon.spy();
      this.populateStateFromData = sinon.spy();
      this.rebuildAndOrRedeploy = sinon.spy();
      this.requiresRebuild = sinon.spy();
      this.requiresRedeploy = sinon.spy();
      this.resetStateContextVersion = sinon.spy();
      this.saveInstanceAndRefreshCards = sinon.spy();
      this.showAdvancedModeConfirm = sinon.spy();
      this.switchBetweenAdvancedAndMirroring = sinon.spy();
      this.switchToMirrorMode = sinon.spy();
      this.switchToAdvancedMode = sinon.spy();
      this.updateInstanceAndReset = sinon.spy();
      // The ones I actually care about
      this.onEnvChange = sinon.spy();
      this.onPortsChange = sinon.spy();
      mockServerModalController = this;
    };
    fetchStackAnalysisMock = new MockFetch();
    createNewBuildMock = sinon.stub();
    createAndBuildNewContainerMock = new MockFetch();
    loadingPromiseFinishedValue = null;

    angular.mock.module('app');
    angular.mock.module(function ($provide, $controllerProvider) {
      if (replaceSMC) {
        $controllerProvider.register('ServerModalController', ServerModalController);
      }
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
      $provide.factory('fetchRepoDockerfiles', function ($q) {
        fetchRepoDockerfilesStub = sinon.stub().returns($q.when([dockerfile]));
        return fetchRepoDockerfilesStub;
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
      $provide.factory('fetchDockerfileForContextVersion', function ($q) {
        fetchDockerfileForContextVersionStub = sinon.stub().returns($q.when(dockerfile));
        return fetchDockerfileForContextVersionStub;
      });
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
    });

    angular.mock.inject(function (_$controller_,
                                  _$rootScope_,
                                  _keypather_,
                                  _$q_) {
      $controller = _$controller_;
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      $q = _$q_;

      keypather.set($rootScope, 'dataApp.data.activeAccount.oauthName', sinon.mock().returns('myOauthName'));
      $scope = $rootScope.$new();
      SMC = $controller('SetupServerModalController', {
        $scope: $scope,
        dockerfileType: false,
        instanceName: opts.instanceName || instanceName,
        repo: opts.repo || repo,
        build: opts.build || newBuild,
        masterBranch: opts.masterBranch || branch
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
    mainACV = {
      mainACV: true,
      attrs: {
        repo: 'HelloWorld',
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
        })
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
      hasDockerfileMirroring: sinon.stub().returns(false),
      on: sinon.stub()
    };
    instances = [
      mockInstance,
      {
        hasDockerfileMirroring: sinon.stub().returns(false),
        getRepoName: sinon.stub().returns(mocks.repoList[0].full_name.split('/')[1])
      }, {
        hasDockerfileMirroring: sinon.stub().returns(false),
        getRepoName: sinon.spy(),
        attrs: {
          name: 'foo'
        }
      }
    ];
  }
  beforeEach(initializeValues);

  describe('Init', function () {
    describe('Init with passed-in values', function () {
      beforeEach(function (done) {
        initializeValues();
        initState({
          dockerfileType: 'blankDockerfile',
          instanceName: 'instanceName',
          repo: repo,
          build: newBuild,
          masterBranch: branch
        }, false, done);
      });

      it('should not fetch the repo list on load', function () {
        $scope.$digest();
        sinon.assert.notCalled($rootScope.dataApp.data.activeAccount.oauthName);
        expect(SMC.state.repo).to.exist;
        expect(SMC.state.build).to.exist;
        expect(SMC.state.acv).to.exist;
        expect(SMC.state.contextVersion).to.exist;
        expect(SMC.state.branch).to.exist;
        expect(SMC.state.advanced).to.exist;
        expect(SMC.state.repoSelected).to.exist;
      });
    });
  });


  describe('methods', function () {
    beforeEach(initState.bind(null, {}, null));

    describe('createServer', function () {

      it('create server should create and build a new instance', function () {
        SMC.state.selectedStack = {
          key: 'ruby_ror',
          ports: '8000, 900, 80'
        };
        SMC.resetStateContextVersion = sinon.stub().returns($q.when(true));

        SMC.state.dst = '/foo';
        sinon.assert.notCalled(updateDockerfileFromStateStub);

        createNewBuildMock.returns(newBuild);

        SMC.createServer();
        $scope.$digest();

        sinon.assert.calledOnce(updateDockerfileFromStateStub);
        var populateDockerfileOpts = updateDockerfileFromStateStub.lastCall.args[0];

        expect(populateDockerfileOpts.opts.masterPod).to.be.ok;
        expect(populateDockerfileOpts.branch.attrs.name).to.equal('branchName');
        expect(populateDockerfileOpts.repo).to.equal(repo);
        expect(populateDockerfileOpts.selectedStack.key).to.equal('ruby_ror');
        expect(populateDockerfileOpts.containerFiles[0].type).to.equal('Main Repository');
        expect(populateDockerfileOpts.ports).to.eql(['8000', '900', '80']);
        $scope.$digest();

        createAndBuildNewContainerMock.triggerPromise(mockInstance);
        $scope.$digest();

        sinon.assert.calledOnce(createAndBuildNewContainerMock.getFetchSpy());
        expect(createAndBuildNewContainerMock.getFetchSpy().lastCall.args[1]).to.equal(instanceName);

        sinon.assert.calledOnce(SMC.resetStateContextVersion);
        sinon.assert.calledWith(SMC.resetStateContextVersion, mockInstance.contextVersion, true);

        expect(SMC.state.opts.ipWhitelist).to.deep.equal({enabled: false});
      });

      it('should not update the dockerfile from state, if in advanced mode', function () {
        updateDockerfileFromStateStub.reset();
        $scope.$watch = sinon.stub();
        SMC.state.selectedStack = {
          key: 'ruby_ror'
        };
        SMC.resetStateContextVersion = sinon.stub().returns($q.when(true));

        SMC.state.dst = '/foo';
        sinon.assert.notCalled(updateDockerfileFromStateStub);
        SMC.state.advanced = true;


        SMC.createServer();
        $scope.$digest();
        createAndBuildNewContainerMock.triggerPromise(mockInstance);
        $scope.$digest();
        sinon.assert.notCalled(updateDockerfileFromStateStub);
        sinon.assert.calledOnce(createAndBuildNewContainerMock.getFetchSpy());
        expect(createAndBuildNewContainerMock.getFetchSpy().lastCall.args[1]).to.equal(instanceName);

        sinon.assert.calledOnce(SMC.resetStateContextVersion);
        sinon.assert.calledWith(SMC.resetStateContextVersion, mockInstance.contextVersion, true);
        expect(SMC.state.opts.ipWhitelist).to.deep.equal({enabled: false});
      });

      it('should call resetStateContextVersion if something fails', function (done) {
        updateDockerfileFromStateStub.reset();
        $scope.$watch = sinon.stub();
        SMC.state.selectedStack = {
          key: 'ruby_ror'
        };
        SMC.resetStateContextVersion = sinon.stub().returns($q.when(true));

        SMC.state.dst = '/foo';
        sinon.assert.notCalled(updateDockerfileFromStateStub);
        SMC.state.advanced = true;
        SMC.state.contextVersion = {};

        var error = new Error('asdasdas');
        SMC.createServer()
          .catch(function (err) {
            expect(error, 'error').to.equal(err);
            sinon.assert.notCalled(updateDockerfileFromStateStub);
            sinon.assert.calledOnce(createAndBuildNewContainerMock.getFetchSpy());
            expect(createAndBuildNewContainerMock.getFetchSpy().lastCall.args[1]).to.equal(instanceName);

            sinon.assert.calledOnce(SMC.resetStateContextVersion);
            sinon.assert.calledWith(SMC.resetStateContextVersion, SMC.state.contextVersion, false);
            done();
          });
        $scope.$digest();
        createAndBuildNewContainerMock.triggerPromiseError(error);
        $scope.$digest();
      });
    });

    describe('Ports', function () {
      it('should update the dockerfile form state when ports are updated', function () {
        updateDockerfileFromStateStub.reset();
        $scope.$digest();
        sinon.assert.notCalled(updateDockerfileFromStateStub);
        SMC.state.ports = [1,2,3];
        $scope.$digest();
        sinon.assert.calledOnce(updateDockerfileFromStateStub);
        sinon.assert.calledWith(
          updateDockerfileFromStateStub,
          SMC.state
        );
      });
    });
  });

  describe('rebuild', function () {
    var cv = {};
    beforeEach(initState.bind(null, {}, null));
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

  describe('Steps', function () {
    beforeEach(initState.bind(null, {}, null));

    beforeEach(function () {
      closeSpy.reset();
      SMC.openItems.remove = sinon.stub();
      SMC.openItems.add = sinon.stub();
      SMC.state.acv = acv;
      SMC.state.branch = branch;

      SMC.getUpdatePromise = sinon.stub();
      fetchDockerfileFromSourceStub.reset();
      createNewBuildMock.returns(newBuild);
      SMC.state.selectedStack = {
        key: 'ruby_ror',
        ports: '8000, 900, 80',
        selectedVersion: '2.0'
      };
      SMC.state.startCommand = 'echo "1";';
      SMC.resetStateContextVersion = sinon.stub().returns($q.when(true));

      $scope.$digest();
    });

    it('should have the correct tabs when moving through steps', function () {
      expect(SMC.selectedTab).to.equal('repository');

      SMC.goToNextStep(); // Step #2
      $scope.$digest();
      expect(SMC.selectedTab).to.equal('commands');
      sinon.assert.notCalled(fetchDockerfileFromSourceStub);

      SMC.goToNextStep(); // Step #3
      $scope.$digest();
      expect(SMC.selectedTab).to.equal('default');

      // It should add the new dockerfile
      sinon.assert.calledOnce(SMC.openItems.add);
      sinon.assert.calledOnce(fetchDockerfileFromSourceStub);
      expect(SMC.state.dockerfile).to.equal(dockerfile);
      SMC.goToNextStep(); // Step #4
      $scope.$digest();

      createAndBuildNewContainerMock.triggerPromise(mockInstance);
      $scope.$digest();

      expect(SMC.selectedTab).to.equal('logs');
    });

    it('should handle errors', function () {
      var error = new Error('Hello World');
      sinon.stub(SMC, 'createServer').returns($q.reject(error));

      SMC.goToNextStep(); // Step #2
      $scope.$digest();

      SMC.goToNextStep(); // Step #3
      $scope.$digest();

      SMC.goToNextStep(); // Step #4
      $scope.$digest();

      sinon.assert.calledOnce(errsMock.handler);
      sinon.assert.calledWith(errsMock.handler, error);
      expect(SMC.selectedTab).to.equal('default');
      expect(SMC.state.step).to.equal(3);
    });

    it('should not go to the `commands` tab if the stack and the version are not selected', function () {
      SMC.state.selectedStack = {};
      expect(SMC.selectedTab).to.equal('repository');

      SMC.goToNextStep(); // Try to go to step #2
      $scope.$digest();
      expect(SMC.selectedTab).to.equal('repository');

      SMC.state.selectedStack = {
        key: 'ruby_ror',
      };
      SMC.goToNextStep(); // Try to go to step #2
      $scope.$digest();
      expect(SMC.selectedTab).to.equal('repository');

      SMC.state.selectedStack = {
        key: 'ruby_ror',
        selectedVersion: '2.0'
      };
      SMC.goToNextStep(); // Step #2
      $scope.$digest();
      expect(SMC.selectedTab).to.equal('commands');
    });
 });

  describe('Close Modal', function () {
    beforeEach(initState.bind(null, {}, null));

    it('should close the modal if the controller is not dirty', function () {
      closeSpy.reset();
      sinon.stub(SMC, 'isDirty').returns(false);
      SMC.actions.close();
      $scope.$digest();
      sinon.assert.calledOnce(closeSpy);
    });

    it('should show the close popover with the save and build button disabled', function () {
      closeSpy.reset();
      SMC.instance = {
        hello: 'world',
        destroy: sinon.stub()
      };
      sinon.stub(SMC, 'isDirty').returns(true);
      keypather.set(SMC, 'serverForm.$invalid', true);
      SMC.actions.close();
      $scope.$digest();
      sinon.assert.calledOnce(showModalStub);
      expect(showModalStub.lastCall.args[0]).to.deep.equal({
        controller: 'ConfirmCloseServerController',
        controllerAs: 'CMC',
        templateUrl: 'confirmCloseServerView',
        inputs: {
          hasInstance: true,
          shouldDisableSave: true
        }
      });
      sinon.assert.calledOnce(closeSpy);
    });

    it('should show the close popover normally', function () {
      closeSpy.reset();
      SMC.instance = {
        hello: 'world',
        destroy: sinon.stub()
      };
      sinon.stub(SMC, 'isDirty').returns(true);
      SMC.actions.close();
      $scope.$digest();
      sinon.assert.calledOnce(showModalStub);
      expect(showModalStub.lastCall.args[0]).to.deep.equal({
        controller: 'ConfirmCloseServerController',
        controllerAs: 'CMC',
        templateUrl: 'confirmCloseServerView',
        inputs: {
          hasInstance: true,
          shouldDisableSave: null
        }
      });
      sinon.assert.calledOnce(closeSpy);
    });
  });

  describe('Env change', function () {
    beforeEach(initState.bind(null, {}, true));

    it('should correctly call onEnvChange when the envs have changed ', function () {
      $scope.$digest();
      sinon.assert.calledOnce(mockServerModalController.onEnvChange);
      SMC.state.opts.env = ['asdasd=123'];
      $scope.$digest();
      sinon.assert.calledTwice(mockServerModalController.onEnvChange);
    });
  });

  describe('isTabVisible', function () {
    beforeEach(initState.bind(null, {}, null));

    it('should return false for an undefined tab', function () {
      expect(SMC.isTabVisible('thingthatdoesntexist')).to.equal(false);
      expect(SMC.isTabVisible('thiasdfng')).to.equal(false);
    });

    it('should return false for a feature flag that is disabled', function () {
      SMC.instance = {
        contextVersion: {
          getMainAppCodeVersion: sinon.stub().returns(false)
        }
      }
      SMC.state.step = 3
      keypather.set($rootScope, 'featureFlags.backup', true);
      expect(SMC.isTabVisible('backup')).to.equal(true);
      keypather.set($rootScope, 'featureFlags.backup', false);
      expect(SMC.isTabVisible('backup')).to.equal(false);
    });

    it('should return the correct state when in advanced mode', function () {
      SMC.state.advanced = true;
      expect(SMC.isTabVisible('ports')).to.equal(false);
      expect(SMC.isTabVisible('translation')).to.equal(true);
      expect(SMC.isTabVisible('buildfiles')).to.equal(true);
      expect(SMC.isTabVisible('files')).to.equal(false);
    });

    it('should return the correct state when mirroring dockerfile', function () {
      SMC.state.advanced = 'isMirroringDockerfile';
      expect(SMC.isTabVisible('ports')).to.equal(false);
      expect(SMC.isTabVisible('translation')).to.equal(false);
      expect(SMC.isTabVisible('buildfiles')).to.equal(true);
      expect(SMC.isTabVisible('files')).to.equal(false);
    });

    it('should all return false if in basic mode and in the first step', function () {
      SMC.state.advanced = false;
      SMC.state.step = 1;
      expect(SMC.isTabVisible('repository')).to.equal(true);
      expect(SMC.isTabVisible('ports')).to.equal(false);
      expect(SMC.isTabVisible('buildfiles')).to.equal(false);
      expect(SMC.isTabVisible('files')).to.equal(false);
      expect(SMC.isTabVisible('logs')).to.equal(false);
    });

    it('should all return true if in basic mode and in the last step', function () {
      SMC.state.advanced = false;
      SMC.state.step = 4;
      expect(SMC.isTabVisible('ports')).to.equal(true);
      expect(SMC.isTabVisible('buildfiles')).to.equal(true);
      expect(SMC.isTabVisible('files')).to.equal(true);
      expect(SMC.isTabVisible('logs')).to.equal(true);
    });
  });

  describe('needsToBeDirtySaved', function () {
    beforeEach(initState.bind(null, {}, null));

    it('should return true if there is an instance', function () {
      SMC.instance = {};
      expect(SMC.needsToBeDirtySaved()).to.equal(true);
    });

    it('should return false if there is no instance', function () {
      SMC.instance = null;
      expect(SMC.needsToBeDirtySaved()).to.equal(false);
    });
  });

  describe('showStackSelector', function () {
    beforeEach(initState.bind(null, {}, null));

    it('should return true if there is an instance', function () {
      SMC.state.advanced = true;
      expect(SMC.showStackSelector()).to.equal(false);
    });

    it('should return false if there is no instance', function () {
      SMC.state.advanced = false;
      expect(SMC.showStackSelector()).to.equal(true);
    });
  });

  describe('isPrimaryButtonDisabled', function () {
    beforeEach(initState.bind(null, {}, null));

    it('should return fasle if form is valid', function () {
      SMC.state.selectedStack = {
        selectedVersion: 'dfasdfsd'
      };
      SMC.state.step = 3;
      keypather.set(SMC, 'repositoryForm.$invalid', false);

      expect(SMC.isPrimaryButtonDisabled()).to.equal(false);
    });

    it('should return true if form is invalid and is on step two', function () {
      SMC.state.step = 2;
      keypather.set(SMC, 'repositoryForm.$invalid', true);

      expect(SMC.isPrimaryButtonDisabled()).to.equal(true);
    });

    it('should return true if selected stack is invalid', function () {
      SMC.state.selectedStack = null;
      SMC.state.step = 1;

      expect(SMC.isPrimaryButtonDisabled()).to.equal(true);
    });
  });

  describe('$on resetStateContextVersion', function () {
    beforeEach(initState.bind(null, {}, null));
    beforeEach(function () {
      SMC.resetStateContextVersion = sinon.stub().returns($q.when(true));
    });

    it('should load if it should show the spinner', function () {
      $scope.$digest();
      $scope.$emit('resetStateContextVersion', SMC.state.contextVersion, true);
      expect($rootScope.isLoading.setupServerModal).to.equal(true);
      $scope.$digest();
      $scope.$digest();
      expect($rootScope.isLoading.setupServerModal).to.equal(false);
    });

    it('should not load if it should show not the spinner', function () {
      $scope.$emit('resetStateContextVersion', SMC.state.contextVersion, false);
      $scope.$digest();
      expect($rootScope.isLoading.setupServerModal).to.equal(false);
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
});
