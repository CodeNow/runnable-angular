/*global runnable:true, mocks: true, directiveTemplate: true, xdescribe: true, before, xit: true */
'use strict';
var MockFetch = require('../../fixtures/mockFetch');

describe('NewContainerModalController'.bold.underline.blue, function () {
  var $scope;
  var NCMC;

  // Imported Values
  var $controller;
  var $rootScope;
  var $q;
  var keypather;

  // Stubs
  var helpCardsStub;
  var errsStub;
  var createAndBuildNewContainerStub;
  var createNewBuildAndFetchBranch;
  var fetchInstancesByPodStub;
  var closeStub;
  var closeModalStub;
  var showModalStub;
  var fetchOwnerRepoStub;
  var fetchInstancesStub;
  var copySourceInstanceStub;

  // Mocked Values
  var instances;
  var mockInstance;
  var mockBuild;
  var repos;
  var activeAccount;
  var repoBuildAndBranch;
  var mockSourceInstance;

  function initState () {
    helpCardsStub= {
      getActiveCard: sinon.stub()
    };
    errsStub = {
      handler: sinon.spy()
    };

    createAndBuildNewContainerStub = new MockFetch();

    angular.mock.module('app');
    angular.mock.module(function ($provide) {
      $provide.value('errs', errsStub);
      $provide.value('helpCards', helpCardsStub);
      $provide.factory('fetchInstancesByPod', function ($q) {
        fetchInstancesByPodStub = sinon.stub().returns($q.when(instances));
        return fetchInstancesByPodStub;
      });
      $provide.factory('fetchInstances', function ($q) {
        fetchInstancesStub = sinon.stub().returns($q.when(instances));
        return fetchInstancesStub;
      });
      $provide.factory('copySourceInstance', function ($q) {
        copySourceInstanceStub = sinon.stub().returns($q.when(mockSourceInstance));
        return copySourceInstanceStub;
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
      $provide.factory('createAndBuildNewContainer', function ($q) {
        createAndBuildNewContainerStub = sinon.stub().returns($q.when(mockBuild));
        return createAndBuildNewContainerStub;
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
      _$rootScope_,
      _keypather_,
      _$q_
    ) {
      $controller = _$controller_;
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      $q = _$q_;

      activeAccount = {
        oauthName: sinon.mock().returns('myOauthName')
      };
      keypather.set($rootScope, 'dataApp.data.activeAccount', activeAccount);
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
    mockBuild = {
      contextVersion: {
        id: 'foo',
        getMainAppCodeVersion: sinon.stub(),
        appCodeVersions: {
          create: sinon.stub().callsArg(1)
        }
      },
      attrs: {
        env: []
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

    it('should fetch all templates instances', function () {
      $scope.$digest();
      sinon.assert.calledOnce(fetchInstancesStub);
      sinon.assert.calledWith(fetchInstancesStub, { githubUsername: 'HelloRunnable' });
      expect(NCMC.templateServers).to.equal(instances);
    });
  });

  describe('Methods', function () {
    describe('createBuildAndGoToNewRepoModal', function () {
      it('should create a build and fetch the branch', function () {
        var repo = {};
        sinon.stub(NCMC, 'newRepositoryContainer');

        NCMC.createBuildAndGoToNewRepoModal(repo);
        $scope.$digest();
        sinon.assert.calledOnce(createNewBuildAndFetchBranch);
        sinon.assert.calledWith(createNewBuildAndFetchBranch, activeAccount, repo);
        sinon.assert.calledOnce(NCMC.newRepositoryContainer);
        sinon.assert.calledOnce(NCMC.newRepositoryContainer, repoBuildAndBranch);
      });
    });

    describe('newRepositoryContainer', function () {
      it('should close the modal and call the new modal', function () {
        NCMC.newRepositoryContainer(repoBuildAndBranch);
        $scope.$digest();
        sinon.assert.calledOnce(closeStub);
        sinon.assert.calledOnce(showModalStub);
        sinon.assert.calledWith(showModalStub, {
          controller: 'SetupServerModalController',
          controllerAs: 'SMC',
          templateUrl: 'setupServerModalView',
          inputs: {
            repo: repoBuildAndBranch.repo,
            build: repoBuildAndBranch.build,
            masterBranch: repoBuildAndBranch.masterBranch,
          }
        });
      });
    });

    describe('newTemplateContainer', function () {
      it('should close the modal and call the new modal', function () {
        NCMC.newTemplateContainer(repoBuildAndBranch);
        $scope.$digest();
        sinon.assert.calledOnce(closeStub);
        sinon.assert.calledOnce(showModalStub);
        sinon.assert.calledWith(showModalStub, {
         controller: 'SetupTemplateModalController',
          controllerAs: 'STMC',
          templateUrl: 'setupTemplateModalView',
          inputs: {
            isolation: null
          }
        });
      });
    });

    describe('setRepo', function () {
      it('should set the repo', function () {
        var repo1 = {};
        var repo2 = {};
        NCMC.setRepo(repo1);
        $scope.$digest();
        expect(NCMC.state.repo).to.equal(repo1);
        NCMC.setRepo(repo2);
        $scope.$digest();
        expect(NCMC.state.repo).to.equal(repo2);
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

    describe('addServerFromTemplate', function () {
      it('should close the modal and call the necessary functions', function () {
        fetchInstancesStub.reset();
        NCMC.addServerFromTemplate(mockSourceInstance);
        $scope.$digest();
        sinon.assert.calledOnce(closeStub);
        sinon.assert.calledOnce(fetchInstancesStub);
        sinon.assert.calledOnce(copySourceInstanceStub);
        sinon.assert.calledOnce(createAndBuildNewContainerStub);
      });

      it('should throw an error if there was an error', function () {
        createAndBuildNewContainerStub.returns($q.reject(new Error('asdfas')));

        fetchInstancesStub.reset();
        NCMC.addServerFromTemplate(mockSourceInstance);
        $scope.$digest();
        sinon.assert.calledOnce(closeStub);
        sinon.assert.calledOnce(fetchInstancesStub);
        sinon.assert.calledOnce(copySourceInstanceStub);
        sinon.assert.calledOnce(createAndBuildNewContainerStub);
        sinon.assert.calledOnce(errsStub.handler);
      });

    });
  });
});
