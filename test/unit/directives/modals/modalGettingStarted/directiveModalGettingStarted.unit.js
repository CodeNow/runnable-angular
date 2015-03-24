'use strict';

// injector-provided
var $rootScope,
  $scope,
  $state,
  $compile,
  keypather,
  callbackCount,
  $timeout,
  $log,
  $templateCache;
var $elScope;

var apiMocks = require('../../../apiMocks/index');
var thisUser = runnable.newUser(apiMocks.user);
var ctx;

function makeDefaultScope() {
  return {
    defaultActions: {
      close: sinon.spy(function (cb) {
        if (typeof cb === 'function') { cb(); }
      })
    }
  };
}
var stacks = angular.copy(apiMocks.stackInfo);
var MockFetch = require('../../../fixtures/mockFetch');

/**
 * Things to test:
 *   Should only be able to select 1 repo
 *   Stale repo fetch data should not replace correct data
 *   Switching accounts should trigger new fetch of repos
 *   Selecting a repo should trigger a stack analysis
 */
describe('directiveModalGettingStarted'.bold.underline.blue, function () {
  beforeEach(function () {
    ctx = {};
  });
  function injectSetupCompile() {
    ctx.errsMock = {
      handler: sinon.spy()
    };

    function copyInstanceFunction(opts, cb) {
      cb();
    }
    ctx.instanceLists = [{
      attrs: angular.copy(apiMocks.instances.building),
      copy: sinon.spy(copyInstanceFunction),
      containers: {
        models: [{
          urls: function () {
            return ['http://asdf-helloRunnable.runnableapp.com:8080'];
          }
        }]
      }
    }, {
      attrs: angular.copy(apiMocks.instances.running),
      copy: sinon.spy(copyInstanceFunction)
    }, {
      attrs: angular.copy(apiMocks.instances.stopped),
      copy: sinon.spy(copyInstanceFunction)
    }];
    ctx.gsInstanceLists = angular.copy(ctx.instanceLists);

    ctx.stackInfo = angular.copy(stacks);
    ctx.fetchStackInfoMock = new MockFetch();

    ctx.newVersion = {
      attrs: angular.copy(apiMocks.contextVersions.setup),
      appCodeVersions: {
        create: sinon.spy(function (repo, cb) {
          cb();
        })
      }
    };
    ctx.newBuild = {
      attrs: angular.copy(apiMocks.builds.setup),
      contextVersion: ctx.newVersion
    };
    ctx.anotherBuild = {
      attrs: angular.copy(apiMocks.builds.built),
      contextVersion: {
        attrs: angular.copy(apiMocks.contextVersions.running),
        appCodeVersions: {
          create: sinon.spy(function (repo, cb) {
            cb();
          })
        }
      }
    };
    ctx.createNewBuildMock = new MockFetch();

    ctx.fetchInstancesCached = true;
    ctx.newForkNameCount = 0;

    ctx.getNewForkNameMock = sinon.spy(function (instance) {
      return instance.attrs.name;
    });

    ctx.copySourceInstanceMock = new MockFetch();

    ctx.newDockerFile = angular.copy(apiMocks.files.dockerfile);
    ctx.createDockerfileFromSourceMock = new MockFetch();

    ctx.gsPopulateDockerfileMock = new MockFetch();

    ctx.createNewInstanceMock = new MockFetch();

    ctx.fetchOwnerReposMock = new MockFetch();

    runnable.reset(apiMocks.user);

    angular.mock.module('app', function ($provide) {
      $provide.value('errs', ctx.errsMock);
      $provide.factory('fetchStackInfo', ctx.fetchStackInfoMock.fetch());
      $provide.factory('createNewBuild', ctx.createNewBuildMock.fetch());
      $provide.value('getNewForkName', ctx.getNewForkNameMock);
      $provide.factory('createDockerfileFromSource', ctx.createDockerfileFromSourceMock.fetch());
      $provide.factory('gsPopulateDockerfile', ctx.gsPopulateDockerfileMock.fetch());
      $provide.factory('createNewInstance', ctx.createNewInstanceMock.fetch());
      $provide.factory('copySourceInstance', ctx.copySourceInstanceMock.fetch());
      $provide.factory('fetchInstances', fixtures.mockFetchInstances.list);

      // Required for subdirective
      $provide.factory('fetchOwnerRepos', ctx.fetchOwnerReposMock.fetch());
    });
    angular.mock.inject(function (
      _$templateCache_,
      _$compile_,
      _$timeout_,
      _keypather_,
      _callbackCount_,
      _$state_,
      _$rootScope_
    ) {
      $rootScope = _$rootScope_;
      $scope = _$rootScope_.$new();
      keypather = _keypather_;
      $compile = _$compile_;
      callbackCount = _callbackCount_;
      $timeout = _$timeout_;
      $state = _$state_;
      $templateCache = _$templateCache_;
    });
    ctx.fakeuser = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'user';
      },
      gravitar: function () {
        return true;
      },
      oauthId: function () {
        return 1;
      },
      fetchSettings: sinon.spy()
    };
    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      },
      gravitar: function () {
        return true;
      },
      oauthId: function () {
        return 2;
      },
      fetchSettings: sinon.spy()
    };
    ctx.fakeOrg2 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org2';
      },
      gravitar: function () {
        return true;
      },
      oauthId: function () {
        return 3;
      },
      fetchSettings: sinon.spy()
    };
    ctx.repo1 = {
      attrs: angular.copy(apiMocks.gh.repos[0]),
      branches: {
        fetch: sinon.spy(function (cb) {
          if (cb) { cb(); }
        }),
        models: apiMocks.branches.bitcoinRepoBranches.map(function (branch) {
          return {
            attrs: branch
          };
        })
      }
    };
    var scope = makeDefaultScope();
    Object.keys(scope).forEach(function (key) {
      $scope[key] = scope[key];
    });

    keypather.set($rootScope, 'dataApp.data.user', thisUser);

    $scope.user = thisUser;

    ctx.template = directiveTemplate.attribute('modal-getting-started', {
      'default-actions': 'defaultActions'
    });

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  describe('Check that the directive added what it needs to the scope', function () {
    beforeEach(function () {
      injectSetupCompile();
    });
    it('should have everything on the scope that was given', function () {
      expect($elScope.defaultActions).to.be.ok;
      expect($elScope.defaultActions.close).to.be.a('function');

      // Now check that the scope was created like it should
      expect($elScope.actions).to.be.ok;
      expect($elScope.actions.addDependency).to.be.a('function');
      expect($elScope.actions.removeDependency).to.be.a('function');
      expect($elScope.actions.changeStep).to.be.a('function');
      expect($elScope.actions.nextStep).to.be.a('function');
      expect($elScope.actions.skipTutorial).to.be.a('function');
      expect($elScope.actions.createAndBuild).to.be.a('function');

      expect($elScope.state).to.be.ok;
      expect($elScope.state.dependencies).to.be.ok;
      expect($elScope.state.opts).to.be.ok;
      expect($elScope.state.step).to.be.ok;
      expect($elScope.state.furthestStep).to.be.ok;

      $scope.$destroy();
      $scope.$digest();
    });
  });
  describe('Scope functions (not createAndBuild)', function () {
    beforeEach(function () {
      injectSetupCompile();
    });
    describe('addDependency', function () {
      var instance;
      beforeEach(function () {
        keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeuser);
        instance = {
          attrs: angular.copy(apiMocks.instances.running),
          containers: {
            models: [{
              urls: function() {
                return ['http://asdf-helloRunnable.runnableapp.com',
                  'http://asdf-helloRunnable.runnableapp.com'];
              }
            }]
          }
        };
      });
      it('should fork a new one', function () {
        $elScope.data.activeAccount = ctx.fakeuser;
        $elScope.actions.addDependency(instance);

        expect($elScope.state.dependencies[0], 'dep').to.be.ok;
        expect($elScope.state.dependencies[0].instance).to.equal(instance);
        expect($elScope.state.dependencies[0].opts, 'opts').to.be.ok;
        expect($elScope.state.dependencies[0].env, 'env').to.be.ok;
        expect($elScope.state.dependencies[0].env.model, 'model').to.be.ok;
        expect($elScope.state.dependencies[0].env.originalUrl, 'originalUrl').to.be.ok;
        expect($elScope.state.dependencies[0].env.newUrl, 'newUrl').to.be.ok;
        expect($elScope.state.dependencies[0].env.placeholder, 'placeholder').to.be.ok;
        expect($elScope.state.dependencies[0].otherEnvs, 'otherEnvs').to.be.ok;
        expect($elScope.state.dependencies[0].env.model, 'model')
          .to.equal(instance.attrs.name.toUpperCase() + '_HOST=asdf-user.runnableapp.com');
        });
      it('should use an existing', function () {
        $elScope.data.activeAccount = ctx.fakeuser;
        $elScope.actions.addDependency(instance, true);

        expect($elScope.state.dependencies[0]).to.be.ok;
        expect($elScope.state.dependencies[0].instance).to.equal(instance);
        expect($elScope.state.dependencies[0].opts).to.not.be.ok;
        expect($elScope.state.dependencies[0].env).to.be.ok;
        expect($elScope.state.dependencies[0].env.model).to.be.ok;
        expect($elScope.state.dependencies[0].env.originalUrl).to.be.ok;
        expect($elScope.state.dependencies[0].env.newUrl).to.not.be.ok;
        expect($elScope.state.dependencies[0].env.placeholder).to.not.be.ok;
        expect($elScope.state.dependencies[0].otherEnvs).to.be.ok;
        expect($elScope.state.dependencies[0].env.model)
          .to.equal(instance.attrs.name.toUpperCase() + '_HOST=asdf-hellorunnable.runnableapp.com');
      });
    });

    describe('removeDependency', function () {
      it('should remove a dependency from the list', function () {
        $elScope.data.activeAccount = ctx.fakeuser;
        keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeuser);
        var instances = [{
          attrs: angular.copy(apiMocks.instances.running),
          containers: {
            models: [{
              urls: function() {
                return ['http://asdf-helloRunnable.runnableapp.com'];
              }
            }]
          }
        }, {
          attrs: angular.copy(apiMocks.instances.building),
          containers: {
            models: [{
              urls: function() {
                return ['http://asdf-helloRunnable.runnableapp.com'];
              }
            }]
          }
        }];
        $elScope.actions.addDependency(instances[0], true);
        $elScope.actions.addDependency(instances[1]);
        var model0 = $elScope.state.dependencies[0];
        var model1 = $elScope.state.dependencies[1];

        expect($elScope.state.dependencies.length).to.equal(2);
        $elScope.actions.removeDependency(model0);
        expect($elScope.state.dependencies.length).to.equal(1);
        expect($elScope.state.dependencies[0]).to.equal(model1);
      });
    });


    describe('changeStep', function () {
      it('should change the step when allowed', function () {
        $elScope.state.repoSelected = true;
        $elScope.state.furthestStep = 2;
        $elScope.actions.changeStep(2);

        expect($elScope.state.repoSelected).to.be.true;

        expect($elScope.data.accountsDisabled()).to.be.true;
      });
      it('should go back when allowed', function () {
        $elScope.state.repoSelected = true;
        $elScope.state.furthestStep = 2;
        $elScope.state.step = 2;
        $elScope.actions.changeStep(1);

        expect($elScope.state.repoSelected).to.be.false;
        expect($elScope.state.furthestStep).to.equal(2);
        expect($elScope.state.step).to.equal(1);
      });
      it('should not change the step when it isn\'t allowed', function () {
        $elScope.actions.changeStep(2);

        expect($elScope.state.furthestStep).to.equal(1);
        expect($elScope.state.step).to.equal(1);
      });
    });

    describe('nextStep', function () {
      it('should change the step and furthestStep', function () {
        $elScope.actions.nextStep(2);
        expect($elScope.state.furthestStep).to.equal(2);
        expect($elScope.state.step).to.equal(2);
      });
      it('should change the step, but not furthestStep', function () {
        $elScope.actions.nextStep(3);
        expect($elScope.state.furthestStep).to.equal(3);
        expect($elScope.state.step).to.equal(3);

        $elScope.actions.changeStep(1);
        $elScope.actions.nextStep(2);
        expect($elScope.state.furthestStep).to.equal(3);
        expect($elScope.state.step).to.equal(2);
      });
    });

    describe('skipTutorial', function () {
      it('should redirect to /new', function (done) {
        var fakeGo = sinon.stub($state, 'go');
        $elScope.data.activeAccount = ctx.fakeOrg1;
        $scope.$digest();
        $elScope.actions.skipTutorial();
        $timeout.flush();
        sinon.assert.called($scope.defaultActions.close);
        sinon.assert.called(fakeGo);
        sinon.assert.calledWith(fakeGo,'instance.new', {
          userName: ctx.fakeOrg1.oauthName()
        });
        done();
      });
    });

    describe('addEnv', function () {
      it('should add a new env model to the item', function () {
        $elScope.data.activeAccount = ctx.fakeOrg1;
        $scope.$digest();
        var item = {
          otherEnvs: []
        };
        $elScope.actions.addEnv(item);
        expect(item.otherEnvs.length).to.equal(1);
      });
    });

    describe('removeEnv', function () {
      it('should add a new env model to the item', function () {
        $elScope.data.activeAccount = ctx.fakeOrg1;
        $scope.$digest();
        var item = {
          otherEnvs: [{ model: 'hello' }]
        };
        $elScope.actions.removeEnv(item, item.otherEnvs[0]);
        expect(item.otherEnvs.length).to.equal(0);
      });
    });
  });

  describe('Basic functionality', function () {
    beforeEach(function () {
      injectSetupCompile();
    });
    it('should fetch basic info at the beginning', function () {
      ctx.fetchStackInfoMock.triggerPromise(ctx.stackInfo);

      var orgs = [ctx.fakeOrg1, ctx.fakeOrg2];
      keypather.set($rootScope, 'dataApp.data.orgs', orgs);
      keypather.set($rootScope, 'dataApp.data.user', ctx.fakeuser);
      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeuser);
      $rootScope.$digest();

      keypather.set($rootScope, 'dataApp.data.instances', { models:[] });
      $rootScope.$digest();

      expect($elScope.data.activeAccount).to.equal(ctx.fakeuser);
      expect($elScope.data.orgs).to.equal(orgs);
      expect($elScope.data.user).to.equal(ctx.fakeuser);

      expect($elScope.state.hideCancelButton).to.be.true;
      ctx.createNewBuildMock.triggerPromise(ctx.newBuild);
      $scope.$digest();

      expect($elScope.state.contextVersion).to.be.ok;
      expect($elScope.state.build).to.be.ok;
      $elScope.state.stack = stacks[0];
      $scope.$digest();

      ctx.createDockerfileFromSourceMock.triggerPromise(ctx.newDockerFile);
      $scope.$digest();
      expect($elScope.state.dockerfile).to.be.ok;

      $scope.$destroy();
      $scope.$digest();
    });


  });


  describe('Create and Build', function () {
    beforeEach(function () {
      injectSetupCompile();
    });
    beforeEach(function () {
      var orgs = [ctx.fakeOrg1, ctx.fakeOrg2];
      keypather.set($rootScope, 'dataApp.data.orgs', orgs);
      keypather.set($rootScope, 'dataApp.data.user', ctx.fakeuser);
      keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeuser);
      $rootScope.$digest();

      keypather.set($rootScope, 'dataApp.data.instances', { models:[] });
      $rootScope.$digest();

      expect($elScope.data.activeAccount).to.equal(ctx.fakeuser);
      expect($elScope.data.orgs).to.equal(orgs);
      expect($elScope.data.user).to.equal(ctx.fakeuser);

      ctx.createNewBuildMock.triggerPromise(ctx.newBuild);
    });
    afterEach(function () {
      $scope.$destroy();
      $scope.$digest();
    });
    it('should stop multiple clicks', function () {
      $elScope.building = true;
      expect(keypather.get($rootScope, 'dataApp.data.loading')).to.not.be.ok;
      $elScope.actions.createAndBuild();
      expect(keypather.get($rootScope, 'dataApp.data.loading')).to.not.be.ok;
    });
    it('should flow all the way through, no dependencies', function (done) {

      $elScope.state.selectedRepo = ctx.repo1;

      $elScope.state.activeBranch = {
        attrs: apiMocks.branches.bitcoinRepoBranches[0]
      };
      ctx.newVersion.appCodeVersions.create = sinon.spy(function (repo, cb) {
        expect(repo).to.deep.equal({
          repo: ctx.repo1.attrs.full_name,
          branch: apiMocks.branches.bitcoinRepoBranches[0].name,
          commit: apiMocks.branches.bitcoinRepoBranches[0].commit.sha
        });
        cb();
      });

      var fakeGo = sinon.stub($state, 'go', function(location, stateParams) {
        expect(location).to.equal('instance.instance');
        expect(stateParams).to.deep.equal({
          userName: 'user',
          instanceName: ctx.repo1.attrs.name
        });
        done();
      });

      $elScope.actions.createAndBuild();
      expect($elScope.building).to.be.true;
      expect(keypather.get($rootScope, 'dataApp.data.loading')).to.be.ok;
      $elScope.state.stack = stacks[0];
      $scope.$digest();

      ctx.createDockerfileFromSourceMock.triggerPromise(ctx.newDockerFile);
      $scope.$digest();
      expect($elScope.state.dockerfile).to.be.ok;

      expect($elScope.state.opts.env).to.be.ok;
      expect($elScope.state.opts.name).to.equal(ctx.repo1.attrs.name);

      sinon.assert.called(ctx.getNewForkNameMock);
      ctx.gsPopulateDockerfileMock.triggerPromise(true);
      $scope.$digest();
      ctx.createNewInstanceMock.triggerPromise(ctx.instanceLists[0]);
      $scope.$digest();
      $timeout.flush();
    });
    it('should flow all the way through, with dependencies', function (done) {
      $elScope.state.selectedRepo = ctx.repo1;

      $elScope.state.activeBranch = {
        attrs: apiMocks.branches.bitcoinRepoBranches[0]
      };
      ctx.newVersion.appCodeVersions.create = sinon.spy(function (repo, cb) {
        expect(repo).to.deep.equal({
          repo: ctx.repo1.attrs.full_name,
          branch: apiMocks.branches.bitcoinRepoBranches[0].name,
          commit: apiMocks.branches.bitcoinRepoBranches[0].commit.sha
        });
        cb();
      });

      $elScope.actions.addDependency(ctx.instanceLists[0]);
      $elScope.actions.addDependency(ctx.instanceLists[1], true);
      $elScope.actions.addDependency(ctx.instanceLists[2]);

      $elScope.state.dependencies[0].otherEnvs.push('asdasd=asdasd');
      $elScope.state.extraEnvs = 'asd=dsfs\naddsdd=asd';

      var fakeGo = sinon.stub($state, 'go', function(location, stateParams) {
        expect($elScope.state.dependencies[0].opts.name)
          .to.equal($elScope.state.dependencies[0].instance.attrs.name);
        expect($elScope.state.dependencies[2].opts.name)
          .to.equal($elScope.state.dependencies[2].instance.attrs.name);

        expect($elScope.state.opts.env.join('\n'))
          .to.equal('SPAAACE_HOST=asdf-user.runnableapp.com\n' +
          'asdasd=asdasd\n' +
            // These next 2 have somekittens as the owner because I'm generating the link
            // in GS with createInstanceUrl
          'SPAAACE_HOST=spaaace-somekittens.runnableapp.com\n' +
          'SPACE_HOST=space-somekittens.runnableapp.com\n' +
          'asd=dsfs\n' +
          'addsdd=asd');

        expect(location).to.equal('instance.instance');
        expect(stateParams).to.deep.equal({
          userName: 'user',
          instanceName: ctx.repo1.attrs.name
        });
        done();
      });

      $elScope.actions.createAndBuild();
      expect($elScope.building).to.be.true;
      expect(keypather.get($rootScope, 'dataApp.data.loading')).to.be.ok;
      $elScope.state.stack = stacks[0];
      $scope.$digest();

      ctx.createDockerfileFromSourceMock.triggerPromise(ctx.newDockerFile);
      $scope.$digest();
      expect($elScope.state.dockerfile).to.be.ok;

      expect($elScope.state.opts.env).to.be.ok;
      expect($elScope.state.opts.name).to.equal(ctx.repo1.attrs.name);

      sinon.assert.called(ctx.getNewForkNameMock);
      ctx.gsPopulateDockerfileMock.triggerPromise(true);
      $scope.$digest();

      // Need one for each dep that should be cloned, which is only 2.
      // instanceList[1] is only being referenced
      ctx.copySourceInstanceMock.triggerPromise(true);
      $scope.$digest();
      ctx.copySourceInstanceMock.triggerPromise(true);
      $scope.$digest();


      ctx.createNewInstanceMock.triggerPromise(ctx.instanceLists[0]);
      $scope.$digest();
      $timeout.flush();
    });
    describe('ERRORS', function () {
      it('error on appCodeCreation, it should create a new build and df', function () {
        $elScope.state.selectedRepo = ctx.repo1;

        var oldDockerFile, oldBuild, oldVersion;
        $elScope.state.activeBranch = {
          attrs: apiMocks.branches.bitcoinRepoBranches[0]
        };

        var error = new Error('adsfadsfadsfadsf');
        ctx.newVersion.appCodeVersions.create = sinon.spy(function (repo, cb) {
          oldDockerFile = $elScope.state.dockerfile;
          oldBuild = $elScope.state.build;
          oldVersion = $elScope.state.contextVersion;
          cb(error);
        });

        ctx.errsMock.handler = sinon.spy(function (err) {
          expect(err).to.equals(error);
        });

        $elScope.actions.createAndBuild();
        expect($elScope.building).to.be.true;
        expect(keypather.get($rootScope, 'dataApp.data.loading')).to.be.ok;
        $elScope.state.stack = stacks[0];
        $scope.$apply();

        ctx.createDockerfileFromSourceMock.triggerPromise(ctx.newDockerFile);
        $scope.$digest();
        ctx.createNewBuildMock.triggerPromise(ctx.anotherBuild);
        $scope.$digest();
        ctx.createDockerfileFromSourceMock.triggerPromise({ body: 'dfsasdfasdf' });
        $scope.$digest();
        expect($elScope.state.dockerfile).to.be.ok;

        sinon.assert.called(ctx.getNewForkNameMock);
        $scope.$digest();

        expect($elScope.state.build).to.not.equal(oldBuild);
        expect($elScope.state.contextVersion).to.not.equal(oldVersion);
        expect($elScope.state.dockerfile).to.not.equal(oldDockerFile);
      });
    });

  });

});
