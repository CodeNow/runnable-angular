/*global runnable:true, mocks: true, directiveTemplate: true, xdescribe: true, before, xit: true */
'use strict';

describe('NewContainerController'.bold.underline.blue, function () {
  var $scope;
  var NCC;

  // Imported Values
  var $rootScope;
  var $controller;
  var $q;
  var keypather;

  // Stubs
  var errsStub;
  var createNewBuildAndFetchBranch;
  var createNonRepoInstanceStub;
  var fetchInstancesByPodStub;
  var closeStub;
  var closeModalStub;
  var showModalStub;
  var fetchOwnerRepoStub;
  var fetchInstancesStub;
  var fetchRepoDockerfilesStub;
  var fetchOrganizationReposStub;
  var handleSocketEventStub;
  var searchOrganizationReposStub;
  var createNewClusterStub;
  var createNewMultiClustersStub;
  var handleMultiClusterCreateResponseStub;

  // Mocked Values
  var instanceName = 'instanceName';
  var branchName = 'feature-1';
  var shouldNotAutofork = true;
  var clusterOpts;
  var masterBranch = 'master';
  var instances;
  var mockInstance;
  var repos;
  var repoBuildAndBranch;
  var mockSourceInstance;
  var mockCurrentOrg;
  var mockCurrentOrgName = 'myOauthName';
  var featureFlagsMock = {
    composeNewService: false,
  };

  function initState () {
    errsStub = {
      handler: sinon.spy()
    };
    mockCurrentOrg = {
      poppa: {
        attrs: {
          id: 1
        }
      },
      github: {
        oauthName: sinon.stub().returns(mockCurrentOrgName),
        attrs: {
          id: 999
        }
      }
    };

    window.helpers.killDirective('ahaGuide');
    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('ahaGuide', {
        isAddingFirstRepo: sinon.stub().returns(false),
        isInGuide: sinon.stub(),
        getCurrentStep: sinon.stub()
      });
      $provide.value('errs', errsStub);
      $provide.factory('fetchInstancesByPod', function ($q) {
        fetchInstancesByPodStub = sinon.stub().returns($q.when(instances));
        return fetchInstancesByPodStub;
      });
      $provide.factory('fetchInstances', function ($q) {
        fetchInstancesStub = sinon.stub().returns($q.when(instances));
        return fetchInstancesStub;
      });
      $provide.factory('fetchOrganizationRepos', function ($q) {
        runnable.reset(mocks.user);
        repos = runnable.newGithubRepos(
          mocks.repoList, {
            noStore: true
          }
        );
        fetchOrganizationReposStub = sinon.stub().returns($q.when(repos));
        return fetchOrganizationReposStub;
      });

      $provide.factory('fetchRepoDockerfiles', function ($q) {
        fetchRepoDockerfilesStub = sinon.stub().returns($q.when([]));
        return fetchRepoDockerfilesStub;
      });
      $provide.factory('demoFlowService', function () {
        return {};
      });
      $provide.factory('createNewCluster', function () {
        createNewClusterStub = sinon.stub().returns($q.when({}));
        return createNewClusterStub;
      });
      $provide.factory('createNewMultiClusters', function () {
        createNewMultiClustersStub = sinon.stub().returns($q.when({}));
        return createNewMultiClustersStub;
      });
      $provide.factory('handleSocketEvent', function ($q) {
        handleSocketEventStub = sinon.stub().returns($q.when({ clusterName: 'henry\'s instance' }));
        return handleSocketEventStub;
      });
      $provide.factory('handleMultiClusterCreateResponse', function ($q) {
        handleMultiClusterCreateResponseStub = sinon.stub().returns($q.when());
        return handleMultiClusterCreateResponseStub;
      });
      $provide.factory('createNonRepoInstance', function ($q) {
        createNonRepoInstanceStub = sinon.stub().returns($q.when(true));
        return createNonRepoInstanceStub;
      });
      $provide.factory('$timeout', function ($q) {
        return function (cb) {
          return $q.when(cb());
        };
      });
      $provide.factory('searchOrganizationRepos', function ($q) {
        var repos = [
          { id: Math.random(), name: 'hello1', url: 'https://github.com/Runnable/hello1', full_name: 'Runnable/hello1', owner: { login: 'Runnable' } },
          { id: Math.random(), name: 'hello2', url: 'https://github.com/Runnable/hello2', full_name: 'Runnable/hello1', owner: { login: 'Runnable' } }
        ];
        searchOrganizationReposStub = sinon.stub().returns($q.when(repos));
        return searchOrganizationReposStub;
      });
      $provide.factory('createNewBuildAndFetchBranch', function ($q) {
        repoBuildAndBranch = {
          repo: {},
          build: {},
          masterBranch: {}
        };
        createNewBuildAndFetchBranch = sinon.stub().returns($q.when(repoBuildAndBranch));
        return createNewBuildAndFetchBranch;
      });
      closeStub = sinon.stub();
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
      $provide.value('currentOrg', mockCurrentOrg);
    });

    angular.mock.inject(function (
      _$controller_,
      _$rootScope_,
      _keypather_,
      _$q_
    ) {
      $controller = _$controller_;
      $q = _$q_;
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $rootScope.featureFlags = featureFlagsMock;
      NCC = $controller(
        'NewContainerController',
        {
          $scope: $scope
        },
        {
          close: closeStub
        }
      );
    });
  }
  function setupMockValues () {
    mockInstance = {
      contextVersion: {
        attrs: {
          asfsd : 'asdfasdf'
        }
      },
      attrs: {
        name: 'mainRepo',
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
    instances = {
      find: function (predicate) {
        return this.models.find(predicate);
      },
      map: function (predicate) {
        return this.models.map(predicate);
      },
      models: [
        mockInstance
      ]
    };
    mockSourceInstance = {
      id: 'mockBuild',
      attrs: {
        name: 'Hello'
      }
    };
  }
  beforeEach(setupMockValues);
  beforeEach(initState);

  beforeEach(function () {
    NCC.state.dockerComposeFile = {
      path: '/path'
    };
    NCC.state.branch = {
      attrs: {
        name: branchName
      }
    };
    NCC.state.dockerComposeTestFile = null;
    NCC.state.repo = {
      attrs: {
        full_name: 'repo1'
      }
    };
    NCC.state.instanceName = 'henry\'s instance';
  });


  describe('Init', function () {
    it('should fetch all user instances', function () {
      $scope.$digest();
      sinon.assert.calledOnce(fetchOrganizationReposStub);
      sinon.assert.calledWith(fetchOrganizationReposStub, 'myOauthName');
      sinon.assert.calledOnce(fetchInstancesByPodStub);
      expect(NCC.githubRepos).to.equal(repos);
      expect(NCC.instances).to.equal(instances);
    });

    it('should not fetch all templates instances', function () {
      $scope.$digest();
      sinon.assert.notCalled(fetchInstancesStub);
    });
  });

  describe('Methods', function () {
    describe('createBuildAndGoToNewRepoModal', function () {
      it('should create a build and fetch the branch', function () {
        var repo = {};
        var dockerfile = null;
        var configurationMethod = false;
        sinon.stub(NCC, 'newRepositoryContainer');

        NCC.createBuildAndGoToNewRepoModal(instanceName, repo, dockerfile, configurationMethod);
        $scope.$digest();
        sinon.assert.calledOnce(createNewBuildAndFetchBranch);
        sinon.assert.calledWith(createNewBuildAndFetchBranch, mockCurrentOrg.github, repo);
        sinon.assert.calledOnce(NCC.newRepositoryContainer);
        sinon.assert.calledWithExactly(NCC.newRepositoryContainer, repoBuildAndBranch, configurationMethod);
        expect(repoBuildAndBranch.instanceName).to.equal(instanceName);
      });

      it('should create a mirror repository container when there is a dockerfile', function () {
        var repo = {};
        var dockerfile = {};
        var configurationMethod = 'dockerfile';
        sinon.stub(NCC, 'newRepositoryContainer');
        sinon.stub(NCC, 'newMirrorRepositoryContainer');

        NCC.createBuildAndGoToNewRepoModal(instanceName, repo, dockerfile, 'dockerfile');
        $scope.$digest();
        sinon.assert.calledOnce(createNewBuildAndFetchBranch);
        sinon.assert.calledWith(createNewBuildAndFetchBranch, mockCurrentOrg.github, repo);
        sinon.assert.calledOnce(NCC.newMirrorRepositoryContainer);
        sinon.assert.calledWithExactly(NCC.newMirrorRepositoryContainer, repoBuildAndBranch);
        sinon.assert.notCalled(NCC.newRepositoryContainer);
        expect(repoBuildAndBranch.instanceName).to.equal(instanceName);
      });
    });

    describe('newRepositoryContainer', function () {
      it('should close the modal and call the new modal', function () {
        var dockerfileType = 'blankDockerfile';
        repoBuildAndBranch.instanceName = instanceName;
        NCC.newRepositoryContainer(repoBuildAndBranch, dockerfileType);
        $scope.$digest();
        sinon.assert.calledOnce(closeStub);
        sinon.assert.calledOnce(showModalStub);
        sinon.assert.calledWith(showModalStub, {
          controller: 'SetupServerModalController',
          controllerAs: 'SMC',
          templateUrl: 'setupServerModalView',
          inputs: {
            dockerfileType: dockerfileType,
            instanceName: instanceName,
            repo: repoBuildAndBranch.repo,
            build: repoBuildAndBranch.build,
            masterBranch: repoBuildAndBranch.masterBranch,
            defaults: {}
          }
        });
      });
    });

    describe('setRepo', function () {
      it('should set the repo', function () {
        var repo1 = {
          attrs: {
            full_name: 'repo1'
          }
        };
        var repo2 = {
          attrs: {
            full_name: 'repo2'
          }
        };
        var stub = sinon.stub();
        NCC.setRepo(repo2, stub);
        $scope.$digest();
        expect(NCC.state.repo).to.deep.equal(repo2);
      });

      it('should call the callback even if there are no dockerfiles', function () {
        fetchRepoDockerfilesStub.returns($q.when([]));
        sinon.stub(NCC, 'createBuildAndGoToNewRepoModal').returns($q.when(true));
        var repo = {
          attrs: {
            full_name: 'Hello'
          }
        };
        var stub = sinon.stub();
        NCC.setRepo(repo, stub);
        $scope.$digest();
        expect(NCC.state.repo).to.equal(repo);
        sinon.assert.calledOnce(fetchRepoDockerfilesStub);
        sinon.assert.calledWith(fetchRepoDockerfilesStub, 'Hello');
        sinon.assert.notCalled(NCC.createBuildAndGoToNewRepoModal);
        expect(repo.dockerfiles).to.have.length(0);
        sinon.assert.calledOnce(stub);
        sinon.assert.calledWith(stub, 'nameContainer');
      });

      it('should call the callback if there are dockerfiles returns', function () {
        fetchRepoDockerfilesStub.returns($q.when([{}]));
        sinon.stub(NCC, 'createBuildAndGoToNewRepoModal').returns($q.when(true));

        var repo = {
          attrs: {
            full_name: 'Hello'
          }
        };
        var stub = sinon.stub();
        NCC.setRepo(repo, stub);
        $scope.$digest();
        expect(NCC.state.repo).to.equal(repo);
        sinon.assert.calledOnce(fetchRepoDockerfilesStub);
        sinon.assert.calledWith(fetchRepoDockerfilesStub, 'Hello');
        sinon.assert.notCalled(NCC.createBuildAndGoToNewRepoModal);
        expect(repo.dockerfiles).to.have.length(1);
        sinon.assert.calledOnce(stub);
        sinon.assert.calledWith(stub, 'nameContainer');
      });
    });

    describe('isRepoAdded', function () {
      it('should correctly identify repos that have been added', function () {
        var repos = {
          attrs: {
             name: 'mainRepo'
          }
        };
        expect(NCC.isRepoAdded(repos, instances)).to.equal(true);
      });

      it('should correctly identify repos that have not been added', function () {
        var repos = {
          attrs: {
             name: 'notMainRepo'
          }
        };
        expect(NCC.isRepoAdded(repos, instances)).to.equal(false);
      });
    });

    describe('setTemplate', function () {
      var goToPanelStub;
      var sourceInstance;
      var instanceName;
      beforeEach(function () {
        instanceName = 'hello';
        goToPanelStub = sinon.stub();
        sourceInstance = {
          attrs: {
            name: instanceName
          }
        };
      });

      it('should fetch the instances', function () {
        NCC.setTemplate(sourceInstance, goToPanelStub);
        $scope.$digest();
        sinon.assert.calledOnce(fetchInstancesStub);
      });

      it('should set the template source and instance name', function () {
        NCC.setTemplate(sourceInstance, goToPanelStub);
        $scope.$digest();
        expect(NCC.state.templateSource).to.equal(sourceInstance);
        expect(NCC.state.instanceName).to.equal(instanceName);
      });

      it('should go to the panel', function () {
        NCC.setTemplate(sourceInstance, goToPanelStub);
        $scope.$digest();
        $scope.$digest();
        sinon.assert.calledOnce(goToPanelStub);
        sinon.assert.calledWith(goToPanelStub, 'nameContainer');
      });
    });

    describe('createBuildFromTemplate', function () {
      var instanceName;
      var sourceInstance;
      beforeEach(function () {
        instanceName = 'instanceName';
        sourceInstance = {};
      });

      it('should close the modal', function () {
        NCC.createBuildFromTemplate(instanceName, sourceInstance);
        $scope.$digest();
        sinon.assert.calledOnce(closeStub);
      });

      it('should create the non repo instance', function () {
        NCC.createBuildFromTemplate(instanceName, sourceInstance);
        $scope.$digest();
        sinon.assert.calledOnce(createNonRepoInstanceStub);
        sinon.assert.calledWith(createNonRepoInstanceStub, instanceName, sourceInstance);
      });

      it('should handle errors', function () {
        createNonRepoInstanceStub.returns($q.reject(new Error()));
        NCC.createBuildFromTemplate(instanceName, sourceInstance);
        $scope.$digest();
        sinon.assert.calledOnce(createNonRepoInstanceStub);
        sinon.assert.calledWith(createNonRepoInstanceStub, instanceName, sourceInstance);
        sinon.assert.calledOnce(errsStub.handler);
      });
    });

     describe('addServerFromTemplate', function () {
      it('should close the modal and call the necessary functions', function () {
        fetchInstancesStub.reset();
        NCC.addServerFromTemplate(mockSourceInstance);
        $scope.$digest();
        sinon.assert.calledOnce(closeStub);
        sinon.assert.calledOnce(fetchInstancesStub);
        sinon.assert.calledOnce(showModalStub);
        sinon.assert.calledWithMatch(showModalStub, {
          controller: 'NameNonRepoContainerViewModalController',
          controllerAs: 'MC',
          templateUrl: 'nameNonRepoContainerView'
        });
      });
    });

    describe('fetchSearchTermsAndAppendToRepos', function () {
      var repoFilter = 'hello';
      beforeEach(function () {
        $scope.$digest();
        NCC.repoFilter = repoFilter;
        NCC.githubRepos = runnable.newGithubRepos(
          [], { noStore: true }
        );
      });

      it('should search organizations repos', function () {
        NCC.fetchSearchTermsAndAppendToRepos();
        $scope.$digest();
        sinon.assert.calledOnce(searchOrganizationReposStub);
        sinon.assert.calledWith(searchOrganizationReposStub, mockCurrentOrgName, repoFilter);
      });

      it('should add all repos found', function () {
        NCC.fetchSearchTermsAndAppendToRepos();
        $scope.$digest();
        var reposJSONNames = NCC.githubRepos.map(function (x) { return x.attrs.name; });
        expect(reposJSONNames).to.deep.equal(['hello1', 'hello2']);
      });

      it('should not add any repos if none were found', function () {
        searchOrganizationReposStub.returns($q.when([]));
        NCC.fetchSearchTermsAndAppendToRepos();
        $scope.$digest();
        var reposJSONNames = NCC.githubRepos.map(function (x) { return x.attrs.name; });
        expect(reposJSONNames).to.deep.equal([]);
      });
    });
  });

  describe('fetchTemplateServers', function () {
    it('should fetch the tempaltes', function () {
      NCC.fetchTemplateServers(mockSourceInstance);
      $scope.$digest();
      sinon.assert.calledOnce(fetchInstancesStub);
      sinon.assert.calledWith(fetchInstancesStub, { githubUsername: 'HelloRunnable' });
      expect(NCC.templateServers).to.equal(instances);
    });
  });

  describe('changeTab', function () {
    beforeEach(function () {
      sinon.spy(NCC, 'fetchTemplateServers');
    });
    afterEach(function () {
      NCC.fetchTemplateServers.restore();
    });

    it('should set the tabName', function () {
      NCC.changeTab('repos');
      expect(NCC.state.tabName).to.equal('repos');
      NCC.changeTab('services');
      expect(NCC.state.tabName).to.equal('services');
    });

    it('should not set an invalid tab name', function () {
      NCC.changeTab('services');
      expect(NCC.state.tabName).to.equal('services');
      NCC.changeTab('asdfasdfasdfrepos');
      expect(NCC.state.tabName).to.equal('services');
    });

    it('should fetch the templates if in services', function () {
      sinon.assert.notCalled(NCC.fetchTemplateServers);
      NCC.changeTab('repos');
      $scope.$digest();
      sinon.assert.notCalled(NCC.fetchTemplateServers);
      $scope.$digest();
      NCC.changeTab('services');
      $scope.$digest();
      sinon.assert.calledOnce(NCC.fetchTemplateServers);
      NCC.changeTab('services');
      $scope.$digest();
      sinon.assert.calledOnce(NCC.fetchTemplateServers);
    });

  });

  describe('docker compose single cluster creation', function () {
    beforeEach(function () {
      featureFlagsMock.multipleWebhooks = true;
      NCC.state.dockerComposeTestFile = false;
      NCC.state.dockerComposeFile = true;
      NCC.state.types.stage = true;
      clusterOpts = {
        isTesting: false,
        testReporters: [],
        parentInputClusterConfigId: '',
        shouldNotAutoFork: true
      }
    });
    it('should create one cluster', function () {
      NCC.state.types.stage = true;
      NCC.createComposeCluster();
      sinon.assert.calledOnce(createNewClusterStub);
      sinon.assert.calledWithExactly(createNewClusterStub,
        NCC.state.repo.attrs.full_name,
        branchName,
        NCC.state.dockerComposeFile.path,
        NCC.state.instanceName,
        mockCurrentOrg.github.attrs.id,
        clusterOpts
      );
    });
  });

  describe('docker compose multi-cluster creation', function () {
    beforeEach(function () {
      featureFlagsMock.multipleWebhooks = true;
      featureFlagsMock.composeNewService = true;
      NCC.state.dockerComposeTestFile = {
        path: '/path'
      };
      NCC.state.types.test = true;
      NCC.state.types.stage = true;
      NCC.state.testReporter = {
        name: 'test reporter'
      };
      NCC.state.repo.attrs.default_branch = masterBranch;
    });

    it('should call createNewMultiClustersStub when the branch is the default', function () {
      NCC.state.branch.attrs.name = masterBranch;
      NCC.state.instanceName = 'nothingSpecial';
      NCC.createComposeCluster();
      $scope.$digest();
      sinon.assert.calledTwice(createNewMultiClustersStub);
      sinon.assert.calledWithExactly(createNewMultiClustersStub,
        NCC.state.repo.attrs.full_name,
        masterBranch,
        NCC.state.dockerComposeFile.path,
        mockCurrentOrg.github.attrs.id
      );
      sinon.assert.calledWithExactly(createNewMultiClustersStub,
        NCC.state.repo.attrs.full_name,
        masterBranch,
        NCC.state.dockerComposeTestFile.path,
        mockCurrentOrg.github.attrs.id,
        !!NCC.state.dockerComposeTestFile,
        [ NCC.state.testReporter.name ]
      );
    });
    it('should call createNewClustersStub when the branch is not the default', function () {
      NCC.state.branch.attrs.name = branchName;
      var parentClusterConfigId = 'asdasdasd';
      handleSocketEventStub.returns($q.when({
        clusterName: 'henry\'s instance',
        parentInputClusterConfigId: parentClusterConfigId
      }));
      NCC.createComposeCluster();
      $scope.$digest();
      $scope.$digest();
      sinon.assert.calledTwice(createNewClusterStub);
      sinon.assert.calledWithExactly(createNewClusterStub,
        NCC.state.repo.attrs.full_name,
        branchName,
        NCC.state.dockerComposeFile.path,
        NCC.state.instanceName,
        mockCurrentOrg.github.attrs.id
      );
      sinon.assert.calledWithExactly(createNewClusterStub,
        NCC.state.repo.attrs.full_name,
        branchName,
        NCC.state.dockerComposeTestFile.path,
        NCC.state.instanceName + '-test',
        mockCurrentOrg.github.attrs.id,
        !!NCC.state.dockerComposeTestFile,
        [ NCC.state.testReporter.name ],
        parentClusterConfigId
      );
    });
  });

  describe('docker compose test cluster creation', function () {
    beforeEach(function () {
      featureFlagsMock.composeNewService = true;
      NCC.state.dockerComposeFile = null;
      NCC.state.dockerComposeTestFile = {
        path: '/path'
      };
      NCC.state.types.test = true;
      NCC.state.testReporter = {
        name: 'test reporter'
      };
      clusterOpts = {
        isTesting: !!NCC.state.dockerComposeTestFile,
        testReporters: [ NCC.state.testReporter.name ],
        parentInputClusterConfigId: '',
        shouldNotAutofork: true
      };
    });

    it('should create one test cluster', function () {
      NCC.createComposeCluster();
      sinon.assert.calledOnce(createNewClusterStub);
      sinon.assert.calledWith(createNewClusterStub,
        NCC.state.repo.attrs.full_name,
        branchName,
        NCC.state.dockerComposeTestFile.path,
        NCC.state.instanceName,
        mockCurrentOrg.github.attrs.id
      );
    });
  });

  describe('docker compose multiple cluster creation', function () {
    beforeEach(function () {
      NCC.state.dockerComposeTestFile = {
        path: '/path'
      };
      NCC.state.types.test = true;
      NCC.state.types.stage = true;
      NCC.state.testReporter = {
        name: 'test reporter'
      };
    });

    it('should create two test clusters', function () {
      NCC.createComposeCluster();
      $scope.$digest();
      sinon.assert.calledTwice(createNewClusterStub);
    });
  });

  describe('returning the correct text for buttons', function () {
    it('should return setup if config method is \'new\'', function () {
      NCC.state.configurationMethod = 'new';
      var text = NCC.getNextStepText();
      expect(text).to.equal('Next Step: Setup');
    });
    it('should return setup if config method is \'blankDockerfile\'', function () {
      NCC.state.configurationMethod = 'blankDockerfile';
      var text = NCC.getNextStepText();
      expect(text).to.equal('Next Step: Setup');
    });
    it('should return Create Environments if config method is \'dockerComposeFile\'', function () {
      NCC.state.configurationMethod = 'dockerComposeFile';
      NCC.state.dockerComposeFile = {};
      NCC.state.dockerComposeTestFile = {};
      var text = NCC.getNextStepText();
      expect(text).to.equal('Create Environments');
    });
    it('should return Create Environment if config method is \'dockerComposeFile\' and no test', function () {
      NCC.state.configurationMethod = 'dockerComposeFile';
      NCC.state.types.test = false;
      var text = NCC.getNextStepText();
      expect(text).to.equal('Create Environment');
    });
    it('should return Create Environment by default or for a dockerfile', function () {
      NCC.state.configurationMethod = 'dockerfile';
      var text = NCC.getNextStepText();
      expect(text).to.equal('Create Environment');
    });
  });
});
