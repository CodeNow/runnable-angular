/*global runnable:true, mocks: true, directiveTemplate: true, xdescribe: true, before, xit: true */
'use strict';

describe('NewContainerModalController'.bold.underline.blue, function () {
  var $scope;
  var NCMC;

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
      poppa: {},
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
      $provide.value('close', closeStub);
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
      NCMC = $controller('NewContainerModalController', {
        $scope: $scope
      });
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
      expect(NCMC.githubRepos).to.equal(repos);
      expect(NCMC.instances).to.equal(instances);
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
        sinon.stub(NCMC, 'newRepositoryContainer');

        NCMC.createBuildAndGoToNewRepoModal(instanceName, repo, dockerfile, configurationMethod);
        $scope.$digest();
        sinon.assert.calledOnce(createNewBuildAndFetchBranch);
        sinon.assert.calledWith(createNewBuildAndFetchBranch, mockCurrentOrg.github, repo);
        sinon.assert.calledOnce(NCMC.newRepositoryContainer);
        sinon.assert.calledWithExactly(NCMC.newRepositoryContainer, repoBuildAndBranch, configurationMethod);
        expect(repoBuildAndBranch.instanceName).to.equal(instanceName);
      });

      it('should create a mirror repository container when there is a dockerfile', function () {
        var repo = {};
        var dockerfile = {};
        var configurationMethod = 'dockerfile'
        sinon.stub(NCMC, 'newRepositoryContainer');
        sinon.stub(NCMC, 'newMirrorRepositoryContainer');

        NCMC.createBuildAndGoToNewRepoModal(instanceName, repo, dockerfile, 'dockerfile');
        $scope.$digest();
        sinon.assert.calledOnce(createNewBuildAndFetchBranch);
        sinon.assert.calledWith(createNewBuildAndFetchBranch, mockCurrentOrg.github, repo);
        sinon.assert.calledOnce(NCMC.newMirrorRepositoryContainer);
        sinon.assert.calledWithExactly(NCMC.newMirrorRepositoryContainer, repoBuildAndBranch);
        sinon.assert.notCalled(NCMC.newRepositoryContainer);
        expect(repoBuildAndBranch.instanceName).to.equal(instanceName);
      });
    });

    describe('newRepositoryContainer', function () {
      it('should close the modal and call the new modal', function () {
        var dockerfileType = 'blankDockerfile';
        repoBuildAndBranch.instanceName = instanceName;
        NCMC.newRepositoryContainer(repoBuildAndBranch, dockerfileType);
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
        NCMC.setRepo(repo1, stub);
        $scope.$digest();
        expect(NCMC.state.repo).to.equal(repo1);
        NCMC.setRepo(repo2, stub);
        $scope.$digest();
        expect(NCMC.state.repo).to.equal(repo2);
      });

      it('should call the callback even if there are no dockerfiles', function () {
        fetchRepoDockerfilesStub.returns($q.when([]));
        sinon.stub(NCMC, 'createBuildAndGoToNewRepoModal').returns($q.when(true));
        var repo = {
          attrs: {
            full_name: 'Hello'
          }
        };
        var stub = sinon.stub();
        NCMC.setRepo(repo, stub);
        $scope.$digest();
        expect(NCMC.state.repo).to.equal(repo);
        sinon.assert.calledOnce(fetchRepoDockerfilesStub);
        sinon.assert.calledWith(fetchRepoDockerfilesStub, 'Hello');
        sinon.assert.notCalled(NCMC.createBuildAndGoToNewRepoModal);
        expect(repo.dockerfiles).to.have.length(0);
        sinon.assert.calledOnce(stub);
        sinon.assert.calledWith(stub, 'dockerfileMirroring');
      });

      it('should call the callback if there are dockerfiles returns', function () {
        fetchRepoDockerfilesStub.returns($q.when([{}]));
        sinon.stub(NCMC, 'createBuildAndGoToNewRepoModal').returns($q.when(true));

        var repo = {
          attrs: {
            full_name: 'Hello'
          }
        };
        var stub = sinon.stub();
        NCMC.setRepo(repo, stub);
        $scope.$digest();
        expect(NCMC.state.repo).to.equal(repo);
        sinon.assert.calledOnce(fetchRepoDockerfilesStub);
        sinon.assert.calledWith(fetchRepoDockerfilesStub, 'Hello');
        sinon.assert.notCalled(NCMC.createBuildAndGoToNewRepoModal);
        expect(repo.dockerfiles).to.have.length(1);
        sinon.assert.calledOnce(stub);
        sinon.assert.calledWith(stub, 'dockerfileMirroring');
      });
    });

    describe('isRepoAdded', function () {
      it('should correctly identify repos that have been added', function () {
        var repos = {
          attrs: {
             name: 'mainRepo'
          }
        };
        expect(NCMC.isRepoAdded(repos, instances)).to.equal(true);
      });

      it('should correctly identify repos that have not been added', function () {
        var repos = {
          attrs: {
             name: 'notMainRepo'
          }
        };
        expect(NCMC.isRepoAdded(repos, instances)).to.equal(false);
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
        NCMC.setTemplate(sourceInstance, goToPanelStub);
        $scope.$digest();
        sinon.assert.calledOnce(fetchInstancesStub);
      });

      it('should set the template source and instance name', function () {
        NCMC.setTemplate(sourceInstance, goToPanelStub);
        $scope.$digest();
        expect(NCMC.state.templateSource).to.equal(sourceInstance);
        expect(NCMC.state.instanceName).to.equal(instanceName);
      });

      it('should go to the panel', function () {
        NCMC.setTemplate(sourceInstance, goToPanelStub);
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
        NCMC.createBuildFromTemplate(instanceName, sourceInstance);
        $scope.$digest();
        sinon.assert.calledOnce(closeStub);
      });

      it('should create the non repo instance', function () {
        NCMC.createBuildFromTemplate(instanceName, sourceInstance);
        $scope.$digest();
        sinon.assert.calledOnce(createNonRepoInstanceStub);
        sinon.assert.calledWith(createNonRepoInstanceStub, instanceName, sourceInstance);
      });

      it('should handle errors', function () {
        createNonRepoInstanceStub.returns($q.reject(new Error()));
        NCMC.createBuildFromTemplate(instanceName, sourceInstance);
        $scope.$digest();
        sinon.assert.calledOnce(createNonRepoInstanceStub);
        sinon.assert.calledWith(createNonRepoInstanceStub, instanceName, sourceInstance);
        sinon.assert.calledOnce(errsStub.handler);
      });
    });

     describe('addServerFromTemplate', function () {
      it('should close the modal and call the necessary functions', function () {
        fetchInstancesStub.reset();
        NCMC.addServerFromTemplate(mockSourceInstance);
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
      NCMC.fetchTemplateServers(mockSourceInstance);
      $scope.$digest();
      sinon.assert.calledOnce(fetchInstancesStub);
      sinon.assert.calledWith(fetchInstancesStub, { githubUsername: 'HelloRunnable' });
      expect(NCMC.templateServers).to.equal(instances);
    });
  });

  describe('changeTab', function () {
    beforeEach(function () {
      sinon.spy(NCMC, 'fetchTemplateServers');
    });
    afterEach(function () {
      NCMC.fetchTemplateServers.restore();
    });

    it('should set the tabName', function () {
      NCMC.changeTab('repos');
      expect(NCMC.state.tabName).to.equal('repos');
      NCMC.changeTab('services');
      expect(NCMC.state.tabName).to.equal('services');
    });

    it('should not set an invalid tab name', function () {
      NCMC.changeTab('services');
      expect(NCMC.state.tabName).to.equal('services');
      NCMC.changeTab('asdfasdfasdfrepos');
      expect(NCMC.state.tabName).to.equal('services');
    });

    it('should fetch the templates if in services', function () {
      sinon.assert.notCalled(NCMC.fetchTemplateServers);
      NCMC.changeTab('repos');
      $scope.$digest();
      sinon.assert.notCalled(NCMC.fetchTemplateServers);
      $scope.$digest();
      NCMC.changeTab('services');
      $scope.$digest();
      sinon.assert.calledOnce(NCMC.fetchTemplateServers);
      NCMC.changeTab('services');
      $scope.$digest();
      sinon.assert.calledOnce(NCMC.fetchTemplateServers);
    });

  });
});
