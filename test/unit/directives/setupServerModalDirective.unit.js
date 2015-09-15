/*global runnable:true, mocks: true, directiveTemplate: true */
'use strict';

describe('setupServerModalDirective'.bold.underline.blue, function () {
  var element;
  var $scope;
  var $rootScope;
  var keypather;
  var $q;
  var $elScope;
  var MockFetch = require('../fixtures/mockFetch');
  var apiMocks = require('../apiMocks/index');

  var stacks = angular.copy(apiMocks.stackInfo);
  var dockerfile = {
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
      $compile,
      _$rootScope_,
      _keypather_,
      _$q_
    ) {
      keypather = _keypather_;
      $rootScope = _$rootScope_;
      $q = _$q_;

      keypather.set($rootScope, 'dataApp.data.activeAccount.oauthName', sinon.mock().returns('myOauthName'));

      $scope = $rootScope.$new();

      $scope.actions = {

      };
      $scope.data = {
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
      var tpl = directiveTemplate.attribute('setup-server-modal', {
        'actions': 'actions',
        'data': 'data'
      });
      element = $compile(tpl)($scope);
      $scope.$digest();
      $elScope = element.isolateScope();
    });
  }
  beforeEach(function () {
    initState();
  });

  it('should fetch the repo list on load', function () {
    sinon.assert.called($rootScope.dataApp.data.activeAccount.oauthName);
    sinon.assert.calledOnce(fetchOwnerRepoStub);
    expect($elScope.data.githubRepos.models).to.exist;

    sinon.assert.called($scope.data.instances[0].getRepoName);
  });

  describe('methods', function(){

    describe('fetchStackData', function () {
      it('should fetch stack data', function () {
        var analysisMockData = {
          languageFramework: 'ruby_ror',
          version: {
            rails: '4.1.8',
            ruby: '0.8'
          }
        };
        var repo = {
          attrs: {
            full_name: 'foo',
            owner: {
              login: 'bar'
            }
          },
          opts: {
            userContentDomain: 'runnable-test.com'
          },
        };

        $elScope.fetchStackData(repo)
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

    it('selectRepo should setup the repo selected view', function () {
      var branches = {
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
      var repo = {
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
      var analysisMockData = {
        languageFramework: 'ruby_ror',
        version: {
          rails: '4.1.8',
          ruby: '0.8'
        }
      };
      var mainACV = {
        mainACV: true
      };
      var newBuild = {
        contextVersion: {
          id: 'foo',
          getMainAppCodeVersion: sinon.stub().returns(mainACV),
          appCodeVersions: {
            create: sinon.stub().callsArg(1)
          }
        }
      };

      keypather.set($rootScope, 'dataApp.data.activeAccount', 'activeAcct');

      createNewBuildMock.returns(newBuild);

      $elScope.selectRepo(repo);
      $scope.$digest();
      fetchStackAnalysisMock.triggerPromise(analysisMockData);
      $scope.$digest();


      sinon.assert.called(repo.fetchBranch);
      $scope.$digest();

      sinon.assert.calledOnce(newBuild.contextVersion.appCodeVersions.create);
      $scope.$digest();
      sinon.assert.calledOnce(newBuild.contextVersion.getMainAppCodeVersion);

      expect($elScope.state.build).to.equal(newBuild);
      expect($elScope.state.contextVersion).to.equal(newBuild.contextVersion);
      expect($elScope.state.branch).to.equal(branches.models[0]);
      expect($elScope.state.repo).to.equal(repo);
      expect($elScope.state.acv).to.equal(mainACV);
      expect(repo.loading).to.equal(false);
      expect($elScope.repoSelected).to.equal(false);

    });

    it('create server should create and build a new instance', function () {
      var repo = {
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
        }
      };
      $elScope.state.acv = {
        attrs: {
          branch: 'branchName'
        }
      };
      $elScope.state.branch = {
        attrs: {
          name: 'branchName'
        }
      };
      $elScope.actions.createAndBuild = sinon.stub().returns($q.when(dockerfile));
      $elScope.state.selectedStack = {
        key: 'ruby_ror'
      };
      $scope.$digest();

      $elScope.state.repo = repo;
      $elScope.state.dst = '/foo';
      sinon.assert.notCalled(updateDockerfileFromStateStub);
      $elScope.createServer();
      $scope.$digest();


      sinon.assert.calledOnce(updateDockerfileFromStateStub);
      var populateDockerfileOpts = updateDockerfileFromStateStub.lastCall.args[0];

      expect(populateDockerfileOpts.opts.masterPod).to.be.ok;
      expect(populateDockerfileOpts.branch.attrs.name).to.equal('branchName');
      expect(populateDockerfileOpts.repo).to.equal(repo);
      expect(populateDockerfileOpts.selectedStack.key).to.equal('ruby_ror');
      expect(populateDockerfileOpts.containerFiles[0].type).to.equal('Main Repository');
    });
  });
});
