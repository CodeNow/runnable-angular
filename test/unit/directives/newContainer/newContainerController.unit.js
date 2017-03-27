/*global runnable:true, mocks: true, directiveTemplate: true, xdescribe: true, before, xit: true */
'use strict';

describe('NewContainerController'.bold.underline.blue, function () {
  var $scope;
  var NCC;

  // Imported Values
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

  // Mocked Values
  var instanceName = 'instanceName';
  var instances;
  var mockInstance;
  var repos;
  var repoBuildAndBranch;
  var mockSourceInstance;
  var mockCurrentOrg;

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
        oauthName: sinon.stub().returns('myOauthName')
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
      $provide.factory('fetchRepoDockerfiles', function ($q) {
        fetchRepoDockerfilesStub = sinon.stub().returns($q.when([]));
        return fetchRepoDockerfilesStub;
      });
      $provide.factory('demoFlowService', function () {
        return {};
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
      $provide.factory('fetchOwnerRepos', function ($q) {
        runnable.reset(mocks.user);
        repos = runnable.newGithubRepos(
          mocks.repoList, {
            noStore: true
          }
        );
        fetchOwnerRepoStub = sinon.stub().returns($q.when(repos));
        return fetchOwnerRepoStub;
      });
    });

    angular.mock.inject(function (
      _$controller_,
      $rootScope,
      _keypather_,
      _$q_
    ) {
      $controller = _$controller_;
      $q = _$q_;
      keypather = _keypather_;

      $scope = $rootScope.$new();
      $rootScope.featureFlags = {
        composeNewService: true
      };
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

  describe('Init', function () {
    it('should fetch all user instances', function () {
      $scope.$digest();
      sinon.assert.calledOnce(fetchInstancesByPodStub);
      sinon.assert.calledOnce(fetchOwnerRepoStub);
      sinon.assert.calledWith(fetchOwnerRepoStub, 'myOauthName');
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
        var configurationMethod = 'dockerfile'
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
            full_name: 'repo1',
            default_branch: 'master'
          }
        };
        var repo2 = {
          attrs: {
            full_name: 'repo2',
            default_branch: 'master'
          }
        };
        var stub = sinon.stub();
        NCC.setRepo(repo1, stub);
        $scope.$digest();
        expect(NCC.state.repo).to.equal(repo1);
        NCC.setRepo(repo2, stub);
        $scope.$digest();
        expect(NCC.state.repo).to.equal(repo2);
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
});
