/*global runnable:true, mocks: true, directiveTemplate: true, xdescribe: true, before, xit: true */
'use strict';

describe('setupServerModalController'.bold.underline.blue, function () {
  var SMC;
  var $controller;
  var $scope;
  var $rootScope;
  var keypather;
  var loadingPromises;
  var $q;
  var featureFlags;
  var MockFetch = require('../fixtures/mockFetch');
  var apiMocks = require('../apiMocks/index');
  var apiClientMockFactory = require('../../unit/apiMocks/apiClientMockFactory');
  var VersionFileModel = require('runnable/lib/models/context/version/file');
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
  var createNewBuildMock;

  var fetchOwnerRepoStub;
  var fetchStackAnalysisMock;
  var updateDockerfileFromStateStub;
  var populateDockerfileStub;
  var fetchDockerfileFromSourceStub;
  var data;
  var closeSpy;
  var showModalStub;
  var closeModalStub;

  var branches;
  var repo;
  var analysisMockData;
  var newBuild;
  var mainACV;
  var acv;
  var branch;

  function initState() {

    fetchStackAnalysisMock = new MockFetch();
    createNewBuildMock = sinon.stub();
    populateDockerfileStub = sinon.stub();

    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.factory('fetchStackAnalysis', fetchStackAnalysisMock.fetch());
      $provide.factory('updateDockerfileFromState', function ($q) {
        updateDockerfileFromStateStub = sinon.stub().returns($q.when(dockerfile));
        return updateDockerfileFromStateStub;
      });
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
      data = {
        stacks: stacks,
        instances: [{
          getRepoName: sinon.stub().returns(mocks.repoList[0].full_name.split('/')[1])
        },{
          getRepoName: sinon.spy(),
          attrs: {
            name: 'foo'
          }
        }]
      };
      $provide.value('data', data);

      $provide.factory('fetchDockerfileFromSource', function ($q) {
        fetchDockerfileFromSourceStub = sinon.stub().returns($q.when(dockerfile));
        return fetchDockerfileFromSourceStub;
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

    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _keypather_,
      _loadingPromises_,
      _$q_
    ) {
      $controller = _$controller_;
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      loadingPromises = _loadingPromises_;
      $q = _$q_;

      keypather.set($rootScope, 'dataApp.data.activeAccount.oauthName', sinon.mock().returns('myOauthName'));
      $scope = $rootScope.$new();
      SMC = $controller('SetupServerModalController', {
        $scope: $scope
       });
    });

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

  }
  beforeEach(initState);

  it('should fetch the repo list on load', function () {
    $scope.$digest();
    sinon.assert.called($rootScope.dataApp.data.activeAccount.oauthName);
    sinon.assert.calledOnce(fetchOwnerRepoStub);
    expect(SMC.data.githubRepos.models).to.exist;
    sinon.assert.called(data.instances[0].getRepoName);
    expect(SMC.data.githubRepos.models[0]).to.have.property('isAdded');
  });

 describe('methods', function(){
    describe('fetchStackData', function () {
      it('should fetch stack data', function () {

        SMC.fetchStackData(repo)
          .then(function (data) {
            var sourceStack = stacks[0];

            expect(data.key).to.equal(sourceStack.key);
            expect(data.startCommand).to.equal(sourceStack.startCommand);
            expect(data.name).to.equal(sourceStack.name);
            expect(data.suggestedVersion).to.equal('4.1.8');
            expect(data.dependencies[0].suggestedVersion).to.equal('0.8');

          });
        $scope.$digest();
        fetchStackAnalysisMock.triggerPromise(analysisMockData);
        $scope.$digest();

        expect(repo.stackAnalysis).to.equal(analysisMockData);
      });
    });

    describe('selectRepo', function () {

      it('selectRepo should setup the repo selected view', function () {
        newBuild.contextVersion.appCodeVersions.create.reset();
        newBuild.contextVersion.getMainAppCodeVersion.reset();
        keypather.set($rootScope, 'dataApp.data.activeAccount', 'activeAcct');

        createNewBuildMock.returns(newBuild);

        SMC.selectRepo(repo);
        $scope.$digest();
        fetchStackAnalysisMock.triggerPromise(analysisMockData);
        $scope.$digest();

        sinon.assert.called(repo.fetchBranch);
        $scope.$digest();

        sinon.assert.calledOnce(newBuild.contextVersion.appCodeVersions.create);
        $scope.$digest();
        sinon.assert.called(newBuild.contextVersion.getMainAppCodeVersion); // Fn also called by watchers

        expect(SMC.state.build).to.equal(newBuild);
        expect(SMC.state.contextVersion).to.equal(newBuild.contextVersion);
        expect(SMC.state.branch).to.equal(branches.models[0]);
        expect(SMC.state.repo).to.equal(repo);
        expect(SMC.state.acv).to.equal(mainACV);
        expect(repo.loading).to.equal(false);
        expect(SMC.repoSelected).to.equal(false);
      });

      it('should not select a repo if once has already been selected', function () {
        keypather.set($rootScope, 'dataApp.data.activeAccount', 'activeAcct');
        newBuild.contextVersion.appCodeVersions.create.reset();
        createNewBuildMock.returns(newBuild);

        SMC.selectRepo(repo);
        expect(SMC.selectRepo(repo)).to.equal(undefined);
        $scope.$digest();

        sinon.assert.notCalled(newBuild.contextVersion.appCodeVersions.create);
      });

    });

    describe('createServer', function () {

      it('create server should create and build a new instance', function () {
        SMC.state.acv = acv;
        SMC.state.branch = branch;
        SMC.actions.createAndBuild = sinon.stub().returns($q.when(newBuild));
        SMC.actions.deleteServer = sinon.stub().returns($q.when(true));
        SMC.state.selectedStack = {
          key: 'ruby_ror',
          ports: '8000, 900, 80'
        };
        SMC.selectRepo(repo);
        SMC.resetStateContextVersion = sinon.stub();

        SMC.state.repo = repo;
        SMC.state.dst = '/foo';
        sinon.assert.notCalled(updateDockerfileFromStateStub);
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

        sinon.assert.calledOnce(SMC.resetStateContextVersion);
        sinon.assert.calledWith(SMC.resetStateContextVersion, newBuild.contextVersion, true);
      });

      it('should not update the dockerfile from state, if in advanced mode', function () {
        updateDockerfileFromStateStub.reset();
        $scope.$watch = sinon.stub();
        SMC.state.acv = acv;
        SMC.state.branch = branch;
        SMC.actions.createAndBuild = sinon.stub().returns($q.when(newBuild));
        SMC.actions.deleteServer = sinon.stub().returns($q.when(true));
        SMC.state.selectedStack = {
          key: 'ruby_ror'
        };
        SMC.resetStateContextVersion = sinon.stub();

        SMC.selectRepo(repo);
        SMC.state.repo = repo;
        SMC.state.dst = '/foo';
        sinon.assert.notCalled(updateDockerfileFromStateStub);
        SMC.state.advanced = true;
        SMC.createServer();
        $scope.$digest();
        sinon.assert.notCalled(updateDockerfileFromStateStub);

        sinon.assert.calledOnce(SMC.resetStateContextVersion);
        sinon.assert.calledWith(SMC.resetStateContextVersion, newBuild.contextVersion, true);
      });

    });

    describe('getElasticHostname', function () {

      it('should get the elastic hostname of a selected repo', function () {
        createNewBuildMock.returns(newBuild);
        SMC.state.selectedStack = {
          key: 'ruby_ror'
        };
        SMC.selectRepo(repo);
        $scope.$digest();
        fetchStackAnalysisMock.triggerPromise(analysisMockData);
        $scope.$digest();
        var generatedElasticHostname = SMC.getElasticHostname();
        var manualEleasticHostname = repo.attrs.name + '-staging-' + repo.attrs.owner.login + '.' + repo.opts.userContentDomain;
        expect(generatedElasticHostname).to.equal(manualEleasticHostname);
      });

      it('should return an empty string if there are no repo attrs', function () {
        expect(SMC.getElasticHostname()).to.equal('');
      });

    });

    it('should correctly return whehter the stack and version are selected', function () {
      expect(SMC.areStackAndVersionSelected()).to.equal(false);
      createNewBuildMock.returns(newBuild);
      SMC.state.selectedStack = {
        key: 'ruby_ror',
        selectedVersion: true
      };
      SMC.selectRepo(repo);
      $scope.$digest();
      fetchStackAnalysisMock.triggerPromise(analysisMockData);
      $scope.$digest();
      expect(SMC.areStackAndVersionSelected()).to.equal(true);
    });

    describe('Ports', function () {

      it('should update the dockerfile form state when ports are updated', function () {
        updateDockerfileFromStateStub.reset();
        $scope.$digest();
        sinon.assert.notCalled(updateDockerfileFromStateStub);
        SMC.state.ports = [1,2,3];
        $scope.$digest();
        sinon.assert.calledOnce(updateDockerfileFromStateStub);
      });

    });

  });

  describe('Steps', function () {

    beforeEach(function () {
      closeSpy.reset();
      SMC.openItems.remove = sinon.stub();
      SMC.openItems.add = sinon.stub();
      SMC.state.acv = acv;
      SMC.state.branch = branch;
      SMC.actions.createAndBuild = sinon.stub().returns($q.when(newBuild));
      SMC.actions.deleteServer = sinon.stub().returns($q.when(true));
      SMC.getUpdatePromise = sinon.stub();
      fetchDockerfileFromSourceStub.reset();
      createNewBuildMock.returns(newBuild);
      SMC.state.selectedStack = {
        key: 'ruby_ror',
        ports: '8000, 900, 80',
        selectedVersion: '2.0'
      };
      SMC.state.startCommand = 'echo "1";';
      SMC.resetStateContextVersion = sinon.stub();

      SMC.selectRepo(repo);
      $scope.$digest();
      fetchStackAnalysisMock.triggerPromise(analysisMockData);
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
      expect(SMC.selectedTab).to.equal(null);

      // It should add the new dockerfile
      sinon.assert.calledOnce(SMC.openItems.add);
      sinon.assert.calledOnce(fetchDockerfileFromSourceStub);
      expect(SMC.state.dockerfile).to.equal(dockerfile);
      SMC.goToNextStep(); // Step #4
      $scope.$digest();
      expect(SMC.selectedTab).to.equal('logs');
    });

    it('should close the modal if it reached the last step and there have been no changes made', function () {
      expect(SMC.selectedTab).to.equal('repository');

      SMC.goToNextStep(); // Step #2
      $scope.$digest();
      SMC.goToNextStep(); // Step #3
      $scope.$digest();
      SMC.goToNextStep(); // Step #4
      $scope.$digest();
      SMC.goToNextStep(); // Close
      $scope.$digest();
      sinon.assert.calledOnce(closeSpy);
      sinon.assert.notCalled(SMC.getUpdatePromise);
    });

    it('should update the instance if changes have been made before closing', function () {
      expect(SMC.selectedTab).to.equal('repository');

      SMC.goToNextStep(); // Step #2
      $scope.$digest();
      SMC.goToNextStep(); // Step #3
      $scope.$digest();
      SMC.goToNextStep(); // Step #4
      $scope.$digest();

      // Something changes
      SMC.state.opts.env.push('WOW=1');

      SMC.goToNextStep(); // Close
      $scope.$digest();
      sinon.assert.notCalled(closeSpy);
      sinon.assert.calledOnce(SMC.getUpdatePromise);
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

    it('should close the modal and and not delete the server if there is no instance', function () {
      closeSpy.reset();
      SMC.instance = null;
      SMC.actions.close();
      $scope.$digest();
      sinon.assert.calledOnce(closeSpy);
    });

    it('should close the modal and delete the server if there is an instancec', function () {
      closeSpy.reset();
      SMC.instance = { hello: 'world' };
      SMC.actions.deleteServer = sinon.stub().returns($q.when(true));
      SMC.actions.close();
      $scope.$digest();
      sinon.assert.calledOnce(SMC.actions.deleteServer);
      sinon.assert.calledOnce(closeSpy);
    });

    it('should close the modal automatically when creating the server', function () {
      SMC.state.acv = {
        attrs: {
          branch: 'branchName'
        }
      };
      SMC.state.branch = {
        attrs: {
          name: 'branchName'
        }
      };
      SMC.actions.createAndBuild = sinon.stub().returns($q.when(newBuild));
      SMC.actions.deleteServer = sinon.stub().returns($q.when(true));
      SMC.state.selectedStack = {
        key: 'ruby_ror'
      };
      SMC.resetStateContextVersion = sinon.stub();
      SMC.selectRepo(repo);

      SMC.state.repo = repo;
      SMC.state.dst = '/foo';
      sinon.assert.notCalled(updateDockerfileFromStateStub);
      SMC.createServerAndClose();
      $scope.$digest();
      sinon.assert.calledOnce(SMC.resetStateContextVersion);
      sinon.assert.calledOnce(closeSpy);
    });
  });

  describe('isDirty', function () {

    beforeEach(function () {
      SMC.state.acv = acv;
      SMC.state.branch = branch;
      SMC.state.contextVersion = {};
      SMC.actions.createAndBuild = sinon.stub().returns($q.when(newBuild));
      SMC.actions.deleteServer = sinon.stub().returns($q.when(true));
      createNewBuildMock.returns(newBuild);
    });

    it('should return false if there is no context version set', function () {
      SMC.state.contextVersion = null;
      SMC.state.opts.env.push('HELLO=1');
      expect(SMC.isDirty()).to.equal(false);
      SMC.state.contextVersion = {};
      expect(SMC.isDirty()).to.equal(true);
    });

    it('should not be dirty until a change is made', function () {
      expect(SMC.isDirty()).to.equal(false);
      SMC.selectRepo(repo);
      $scope.$digest();
      expect(SMC.isDirty()).to.equal(false);
      SMC.state.opts.env.push('HELLO=1');
      expect(SMC.isDirty()).to.equal(true);
    });

    describe('Changes', function () {

      beforeEach(function () {
        SMC.selectRepo(repo);
      });

      it('should be dirty when an ENV variables has changes', function () {
        expect(SMC.isDirty()).to.equal(false);
        SMC.state.opts.env.push('HELLO=1');
        expect(SMC.isDirty()).to.equal(true);
      });

      it('should be dirty when a loading promises is added', function () {
        expect(SMC.isDirty()).to.equal(false);
        loadingPromises.add(SMC.name, $q.when(true));
        $scope.$digest();
        expect(SMC.isDirty()).to.equal(true);
      });

      it('should be dirty when a file is added', function () {
        expect(SMC.isDirty()).to.equal(false);
        SMC.openItems.add(fileModel);
        fileModel.attrs.body = 'FROM nodejs\nCMD echo "1";';
        $scope.$digest();
        expect(SMC.isDirty()).to.equal(true);
      });

    });

  });

});
