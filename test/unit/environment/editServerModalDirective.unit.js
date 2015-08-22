'use strict';

describe('editServerModalDirective'.bold.underline.blue, function () {
  var ctx;
  var $timeout;
  var $scope;
  var $compile;
  var $elScope;
  var $rootScope;
  var keypather;
  var loadingService;
  var $q;

  var apiClientMockFactory = require('../../unit/apiMocks/apiClientMockFactory');
  var sourceMocks = runnable.newContexts(require('../../unit/apiMocks/sourceContexts'), {noStore: true, warn: false});
  var apiMocks = require('../apiMocks/index');
  var mockUserFetch = new (require('../fixtures/mockFetch'))();
  var MockFetch = require('../fixtures/mockFetch');

  beforeEach(function () {
    ctx = {};
  });

  function setup(scope) {

    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      },
      oauthId: function () {
        return 'org1';
      },
      createBuild: sinon.spy(function (opts, cb) {
        $rootScope.$evalAsync(function () {
          cb(null, ctx.build);
        });
        return ctx.build;
      })
    };
    ctx.eventTracking = {
      triggeredBuild: sinon.spy()
    };
    ctx.updateDockerfileFromStateMock = sinon.stub();
    ctx.populateDockerfile = new MockFetch();
    runnable.reset(apiMocks.user);
    ctx.fileModels = [];

    ctx.errsMock = {
      handler: sinon.spy()
    };

    angular.mock.module('app', function ($provide) {
      $provide.factory('helpCards', helpCardsMock.create(ctx));
      $provide.factory('fetchUser', mockUserFetch.autoTrigger(ctx.fakeOrg1));
      $provide.factory('OpenItems', function ($q) {
        ctx.openItemsMock = function () {
          this.models = [];
          this.add = sinon.spy();
          this.remove = sinon.spy();
          this.isClean = sinon.spy(function () {
            return !ctx.fileModels.length;
          });
          this.getAllFileModels = sinon.spy(function () {
            return ctx.fileModels;
          });
          this.updateAllFiles = sinon.stub().returns($q.when(true));
        };
        return ctx.openItemsMock;
      });
      $provide.value('findLinkedServerVariables', sinon.spy());
      $provide.value('eventTracking', ctx.eventTracking);
      $provide.value('configAPIHost', '');
      $provide.value('uploadFile', sinon.spy());
      $provide.value('errs', ctx.errsMock);

      $provide.factory('fetchStackInfo', function ($q) {
        return function () {
          return $q.when({
            languageFramework: 'nodejs',
            version: {
              nodejs: '0.10.35',
              npm: '0.2.0'
            },
            serviceDependencies: []
          });
        };
      });
      $provide.factory('fetchSourceContexts', function ($q) {
        return function () {
          return $q.when(sourceMocks);
        };
      });
      $provide.factory('fetchInstancesByPod', function ($q) {
        return function () {
          return $q.when([]);
        };
      });
      $provide.factory('updateDockerfileFromState', function ($q) {
        return ctx.updateDockerfileFromStateMock
          .returns($q.when(true));
      });
      ctx.parseDockerfileResponse = {
        ports: '80 900 90',
        startCommand: 'hello',
        containerFiles: [],
        commands: [],
        selectedStack: {
          hello: 'cheese'
        }
      };
      ctx.parseDockerfileResponseMock = null;
      $provide.factory('parseDockerfileForCardInfoFromInstance', function ($q) {
        ctx.parseDockerfileResponseMock = sinon.spy(function () {
          return $q.when(ctx.parseDockerfileResponse);
        });
        return ctx.parseDockerfileResponseMock;
      });

      $provide.factory('serverStatusCardHeaderDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
      // Yah, I'm mocking this out. Too many templates are being loaded
      $provide.factory('ngIncludeDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
      $provide.factory('stackSelectorFormDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
      $provide.factory('repositoryFormDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: angular.noop
        };
      });
      $provide.factory('translationRulesDirective', function () {
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

      ctx.loadingPromiseFinishedValue = 0;

      $provide.factory('populateDockerfile', ctx.populateDockerfile.fetch());
      $provide.factory('loadingPromises', function ($q) {
        ctx.loadingPromiseMock = {
          add: sinon.spy(function (namespace, promise) {
            return promise;
          }),
          clear: sinon.spy(),
          finished: sinon.spy(function () {
            return $q.when(ctx.loadingPromiseFinishedValue);
          })
        };
        return ctx.loadingPromiseMock;
      });
    });
    angular.mock.inject(function (
      _$compile_,
      _$timeout_,
      _$rootScope_,
      _keypather_,
      _$httpBackend_,
      _$templateCache_,
      _loading_,
      _$q_
    ) {
      $timeout = _$timeout_;
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      loadingService = _loading_;
      $q = _$q_;
    });
    $scope.defaultActions = {
      close: sinon.spy()
    };
    $scope.stateModel = 'hello';
    sinon.spy(loadingService, 'reset');

    keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeOrg1);
    Object.keys(scope).forEach(function (key) {
      $scope[key] = scope[key];
    });

    ctx.template = directiveTemplate.attribute('edit-server-modal', {
      'instance': 'currentModel',
      'selected-tab': 'stateModel',
      'modal-actions': 'defaultActions'
    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
    $scope.$digest();
  }

  beforeEach(function () {
    ctx.instance = runnable.newInstance(
      apiMocks.instances.running,
      {noStore: true}
    );
    sinon.stub(ctx.instance, 'update', function (opts, cb) {
      return cb();
    });
    sinon.stub(ctx.instance, 'getElasticHostname', function () {
      return '';
    });
    sinon.stub(ctx.instance, 'redeploy', function (cb) {
      return cb();
    });
    ctx.contextVersion = apiClientMockFactory.contextVersion(
      runnable,
      apiMocks.contextVersions.running
    );
    ctx.contextVersion.appCodeVersions.models = [
      {
        attrs: apiMocks.appCodeVersions.bitcoinAppCodeVersion,
        githubRepo: {
          SADFGSHDF: 3
        }
      }
    ];
    ctx.newContextVersion = apiClientMockFactory.contextVersion(
      runnable,
      apiMocks.contextVersions.setup
    );
    ctx.newContextVersion.appCodeVersions.models = [{
      attrs: apiMocks.appCodeVersions.bitcoinAppCodeVersion,
      githubRepo: {
        asdfasDF: 2
      }
    }];
    ctx.rollbackContextVersion = apiClientMockFactory.contextVersion(
      runnable,
      apiMocks.contextVersions.angular
    );
    ctx.rollbackContextVersion.appCodeVersions.models = [{
      attrs: apiMocks.appCodeVersions.bitcoinAppCodeVersion,
      githubRepo: {
        hello: 1
      }
    }];
    sinon.stub(ctx.contextVersion, 'deepCopy', function (cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.newContextVersion);
      });
      return ctx.newContextVersion;
    });
    sinon.stub(ctx.newContextVersion, 'deepCopy', function (cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.contextVersion);
      });
      return ctx.contextVersion;
    });
    sinon.stub(ctx.rollbackContextVersion, 'deepCopy', function (cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.rollbackContextVersion);
      });
      return ctx.rollbackContextVersion;
    });
    sinon.stub(ctx.contextVersion, 'fetch', function (cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.contextVersion);
      });
      return ctx.contextVersion;
    });
    sinon.stub(ctx.rollbackContextVersion, 'fetch', function (cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.rollbackContextVersion);
      });
      return ctx.rollbackContextVersion;
    });

    ctx.instance.contextVersion = ctx.contextVersion;

    ctx.dockerfile = {
      attrs: apiMocks.files.dockerfile,
      update: sinon.spy(function (opts, cb) {
        $rootScope.$evalAsync(function () {
          cb(null, ctx.dockerfile);
        });
        return ctx.dockerfile;
      })
    };

    ctx.anotherDockerfile = {
      attrs: apiMocks.files.anotherDockerfile
    };
    sinon.stub(ctx.newContextVersion, 'fetch', function (cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.newContextVersion);
      });
      return ctx.newContextVersion;
    });
    sinon.stub(ctx.newContextVersion, 'fetchFile', function (opts, cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.dockerfile);
      });
      return ctx.dockerfile;
    });
    sinon.stub(ctx.contextVersion, 'fetchFile', function (opts, cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.anotherDockerfile);
      });
      return ctx.anotherDockerfile;
    });
    sinon.stub(ctx.rollbackContextVersion, 'fetchFile', function (opts, cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.anotherDockerfile);
      });
      return ctx.anotherDockerfile;
    });
    sinon.stub(ctx.newContextVersion, 'update', function (opts, cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.newContextVersion);
      });
      return ctx.newContextVersion;
    });
    sinon.stub(ctx.rollbackContextVersion, 'update', function (opts, cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.rollbackContextVersion);
      });
      return ctx.rollbackContextVersion;
    });
    ctx.build = apiClientMockFactory.build(runnable, apiMocks.contextVersions.running);
    sinon.stub(ctx.build, 'build', function (opts, cb) {
      return cb();
    });
  });
  describe('getUpdatePromise', function () {
    describe('basic mode', function () {
      beforeEach(function () {
        setup({
          currentModel: ctx.instance,
          selectedTab: 'env'
        });
      });
      it('should do nothing if nothing has changed', function () {
        var alertSpy = sinon.spy();
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Container updated successfully.'
          });
        });

        $elScope.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect($elScope.building).to.be.true;
        expect($elScope.state.ports).to.be.ok;
        $scope.$digest();
        sinon.assert.notCalled(ctx.build.build);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        $scope.$digest();
        sinon.assert.calledOnce($scope.defaultActions.close);

        sinon.assert.notCalled(ctx.instance.update);
        sinon.assert.notCalled(ctx.instance.redeploy);
      });

      it('should only update the instance when only envs have changed', function () {
        var alertSpy = sinon.spy();
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Container updated successfully.'
          });
        });

        $elScope.state.opts.env = ['asdasd', 'sadfsdfasdfasdf'];
        $elScope.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect($elScope.building).to.be.true;
        expect($elScope.state.ports).to.be.ok;
        $scope.$digest();
        sinon.assert.notCalled(ctx.build.build);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        $scope.$digest();
        sinon.assert.calledOnce($scope.defaultActions.close);

        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.calledOnce(ctx.instance.redeploy);
      });

      it('should build when promises have been made', function () {
        var alertSpy = sinon.spy();
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Container updated successfully.'
          });
        });
        ctx.loadingPromiseFinishedValue = 2;

        $elScope.state.opts.env = ['asdasd', 'sadfsdfasdfasdf'];
        $elScope.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect($elScope.building).to.be.true;
        expect($elScope.state.ports).to.be.ok;
        sinon.assert.calledOnce($elScope.openItems.isClean);
        sinon.assert.notCalled($elScope.openItems.updateAllFiles);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.build.build);
        $scope.$digest();
        expect($elScope.state.opts.build).to.be.ok;
        $scope.$digest();
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        $scope.$digest();
        sinon.assert.calledOnce($scope.defaultActions.close);

        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.notCalled(ctx.instance.redeploy);
      });
      it('should update the dockerfile when the file is dirty', function () {
        var alertSpy = sinon.spy();
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Container updated successfully.'
          });
        });
        ctx.loadingPromiseFinishedValue = 1;
        ctx.dockerfile.state = {
          isDirty: true
        };
        ctx.fileModels.push(ctx.dockerfile);

        $elScope.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect($elScope.building).to.be.true;
        expect($elScope.state.ports).to.be.ok;
        $scope.$digest();
        sinon.assert.calledOnce($elScope.openItems.updateAllFiles);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.build.build);
        expect($elScope.state.opts.build).to.be.ok;
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        sinon.assert.calledOnce($scope.defaultActions.close);
        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.notCalled(ctx.instance.redeploy);
      });
    });
    describe('Resetting the contextVersion', function () {
      beforeEach(function () {
        setup({
          currentModel: ctx.instance,
          selectedTab: 'env'
        });
      });
      it('should replace everything with stuff based on the new cv', function () {
        var alertSpy = sinon.spy();
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Container updated successfully.'
          });
        });
        ctx.loadingPromiseFinishedValue = 2;
        ctx.newContextVersion.fetchFile.reset();
        $elScope.state.advanced = true;
        ctx.rollbackContextVersion.attrs.advanced = false;
        $elScope.openItems.add.reset();
        loadingService.reset();
        ctx.fakeOrg1.createBuild.reset();
        expect($elScope.state.advanced, 'advanced flag').to.be.ok;
        $scope.$digest();
        var oldAcv = $elScope.state.acv;
        var oldRepo = $elScope.state.repo;
        var oldStartCommand = $elScope.state.startCommand;
        var oldSelectedStack = $elScope.state.selectedStack;
        var oldContainerFiles = $elScope.state.containerFiles;

        var newContainerFile = {
          name: 'hello',
          clone: sinon.spy(function () {
            return newContainerFile;
          })
        };

        ctx.parseDockerfileResponse = {
          ports: '11 22 33',
          startCommand: 'sadfasdfasdf',
          containerFiles: [newContainerFile],
          commands: ['1,. 2 31234'],
          selectedStack: {
            dsfasdf: 'fd'
          }
        };

        ctx.parseDockerfileResponseMock.reset();
        $elScope.resetStateContextVersion(ctx.rollbackContextVersion, true);
        $scope.$digest();

        sinon.assert.called(loadingService.reset);
        expect($elScope.state.advanced, 'advanced flag').to.be.false;
        sinon.assert.called(ctx.loadingPromiseMock.add);
        sinon.assert.called(ctx.rollbackContextVersion.deepCopy);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.rollbackContextVersion.fetchFile);
        sinon.assert.calledOnce($elScope.openItems.remove);
        sinon.assert.calledOnce($elScope.openItems.add);
        $scope.$digest();
        expect($elScope.state.build, 'build').to.be.ok;
        sinon.assert.calledWith(ctx.fakeOrg1.createBuild, {
          contextVersions: [ctx.rollbackContextVersion.id()],
          owner: {
            github: ctx.fakeOrg1.oauthId()
          }
        });
        $scope.$digest();
        sinon.assert.calledOnce(ctx.parseDockerfileResponseMock);
        expect($elScope.state.contextVersion, 'state cv').to.equal(ctx.rollbackContextVersion);
        expect($elScope.state.acv, 'state acv').to.not.equal(oldAcv);
        expect($elScope.state.repo, 'state repo').to.not.equal(oldRepo);
        expect($elScope.state.startCommand, 'state startCommand').to.not.equal(oldStartCommand);
        expect($elScope.state.selectedStack, 'state selectedStack').to.not.equal(oldSelectedStack);
        expect($elScope.state.containerFiles, 'state containerFiles').to.not.equal(oldContainerFiles);

      });
    });
    describe('advanced mode', function () {
      beforeEach(function () {
        setup({
          currentModel: ctx.instance,
          selectedTab: 'env'
        });
        ctx.contextVersion.attrs.advanced = true;
      });
      it('should build when promises have been made', function () {
        var alertSpy = sinon.spy();
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Container updated successfully.'
          });
        });
        ctx.loadingPromiseFinishedValue = 2;

        $elScope.state.opts.env = ['asdasd', 'sadfsdfasdfasdf'];
        $elScope.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect($elScope.building).to.be.true;
        expect($elScope.state.ports).to.be.ok;
        sinon.assert.calledOnce($elScope.openItems.isClean);
        sinon.assert.notCalled($elScope.openItems.updateAllFiles);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.build.build);
        $scope.$digest();
        expect($elScope.state.opts.build).to.be.ok;
        $scope.$digest();
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        $scope.$digest();
        sinon.assert.calledOnce($scope.defaultActions.close);

        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.notCalled(ctx.instance.redeploy);
      });
      it('should build the dockerfile has been updated', function () {
        var alertSpy = sinon.spy();
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Container updated successfully.'
          });
        });
        ctx.loadingPromiseFinishedValue = 1;
        ctx.dockerfile.state = {
          isDirty: true
        };
        ctx.fileModels.push(ctx.dockerfile);

        $elScope.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect($elScope.building).to.be.true;
        expect($elScope.state.ports).to.be.ok;
        $scope.$digest();
        sinon.assert.calledOnce($elScope.openItems.isClean);
        sinon.assert.calledOnce($elScope.openItems.updateAllFiles);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.build.build);
        expect($elScope.state.opts.build).to.be.ok;
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        sinon.assert.calledOnce($scope.defaultActions.close);
        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.notCalled(ctx.instance.redeploy);
      });
      it('should only update the instance when only envs have changed', function () {
        var alertSpy = sinon.spy();
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Container updated successfully.'
          });
        });

        $elScope.state.opts.env = ['asdasd', 'sadfsdfasdfasdf'];
        $elScope.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect($elScope.building).to.be.true;
        expect($elScope.state.ports).to.be.ok;
        $scope.$digest();
        sinon.assert.notCalled(ctx.build.build);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        $scope.$digest();
        sinon.assert.calledOnce($scope.defaultActions.close);

        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.calledOnce(ctx.instance.redeploy);
      });
    });
  });

  it('resets the state properly on error', function () {
    setup({
      currentModel: ctx.instance
    });

    var error = new Error('http://c2.staticflickr.com/8/7001/6509400855_aaaf915871_b.jpg');

    $elScope.state.instance.attrs = {
      env: ['quarblax=b']
    };

    var containerFiles = [
      {
        id: 'containerFileID!',
        clone: sinon.spy()
      }
    ];
    $elScope.state.containerFiles = containerFiles;

    ctx.loadingPromiseMock.finished = function () {
      return $q.reject(error);
    };

    $elScope.getUpdatePromise();

    $scope.$digest();
    sinon.assert.called(ctx.errsMock.handler);
    sinon.assert.calledWith(ctx.errsMock.handler, error);

    $scope.$digest();
    $scope.$digest();
    $rootScope.$apply();
    expect($elScope.building, 'Building').to.be.false;
    expect($elScope.state.opts.env.length).to.equal(0);
    expect($elScope.state.containerFiles.length).to.equal(1);
    expect($elScope.state.dockerfile).to.not.equal(ctx.dockerfile);
    expect($elScope.state.dockerfile).to.equal(ctx.anotherDockerfile);

    // No longer need to clone after the original time
    //sinon.assert.calledOnce(containerFiles[0].clone);
    sinon.assert.calledOnce(ctx.newContextVersion.deepCopy);
    sinon.assert.calledOnce(ctx.contextVersion.fetch);
  });

  describe('change Tab', function () {
    beforeEach(function () {
      setup({
        currentModel: ctx.instance
      });
    });
    it('should navigate since everything is ok', function () {
      $scope.$digest();

      keypather.set($elScope, 'state.advanced', false);
      keypather.set($elScope, 'state.selectedStack', {
        selectedVersion: 'adsfasdfsdf'
      });
      keypather.set($elScope, 'state.startCommand', 'adsasdasd');

      $elScope.changeTab('files');
      $scope.$digest();

      expect($elScope.selectedTab).to.equal('files');
    });
    it('should navigate to repository since it has errors', function () {
      $scope.$digest();

      keypather.set($elScope, 'state.advanced', false);
      keypather.set($elScope, 'state.selectedStack', {});
      keypather.set($elScope, 'state.startCommand', 'adsasdasd');

      $elScope.changeTab('files');
      $scope.$digest();

      expect($elScope.selectedTab).to.equal('repository');
    });
    it('should navigate to commands since it has errors', function () {
      $scope.$digest();

      keypather.set($elScope, 'state.advanced', false);
      keypather.set($elScope, 'state.selectedStack', {
        selectedVersion: 'adsfasdfsdf'
      });
      keypather.set($elScope, 'state.startCommand', null);

      $elScope.changeTab('files');
      $scope.$digest();

      expect($elScope.selectedTab).to.equal('commands');
    });

    it('should navigate fine with advanced mode', function () {
      $scope.$digest();

      keypather.set($elScope, 'state.advanced', true);
      // Digest here since the state.advanced change will trigger a change
      $scope.$digest();
      keypather.set($elScope, 'state.selectedStack', {});
      keypather.set($elScope, 'state.startCommand', null);

      $elScope.changeTab('files');
      $scope.$digest();

      expect($elScope.selectedTab).to.equal('files');
    });
  });

  describe('Tab visibility', function () {
    var allTabs = [
      'buildfiles', 'stack', 'ports', 'env', 'repository', 'files', 'translation', 'logs'
    ];
    var testingSetups;
    beforeEach(function () {
      testingSetups = {
        basic: function () {
          setup({
            currentModel: ctx.instance
          });
        },
        nonRepoBasic: function () {
          ctx.instance.contextVersion.appCodeVersions.models = [];
          setup({
            currentModel: ctx.instance
          });
        },
        nonRepoAdvanced: function () {
          ctx.instance.contextVersion.appCodeVersions.models = [];
          ctx.instance.contextVersion.attrs.advanced = true;
          setup({
            currentModel: ctx.instance
          });
        },
        advanced: function () {
          ctx.instance.contextVersion.attrs.advanced = true;
          setup({
            currentModel: ctx.instance
          });
        }
      };
    });
    var testingObject = {
      basic: [
        'repository', 'ports', 'env', 'commands', 'files', 'translation', 'logs'
      ],
      nonRepoAdvanced: [
        'buildfiles', 'env', 'logs'
      ],
      advanced: [
        'buildfiles', 'env', 'translation', 'logs'
      ]
    };
    Object.keys(testingObject).forEach(function (key) {
      it('should show the correct tabs for a ' + key + ' instance', function () {
        testingSetups[key]();
        $scope.$digest();
        allTabs.forEach(function (tab) {
          expect(testingObject[key].indexOf(tab) > -1, key + ' -> tab: ' + tab)
              .to.equal($elScope.isTabVisible(tab));
        });
      });
    });
    it('should change tabs when advanced mode is triggered', function () {
      testingSetups.basic();
      $scope.$digest();
      allTabs.forEach(function (tab) {
        expect(testingObject.basic.indexOf(tab) > -1, 'basic -> tab: ' + tab)
          .to.equal($elScope.isTabVisible(tab));
      });
      $elScope.state.advanced = true;
      $scope.$digest();
      allTabs.forEach(function (tab) {
        expect(testingObject.advanced.indexOf(tab) > -1, 'advanced -> tab: ' + tab)
          .to.equal($elScope.isTabVisible(tab));
      });
    });
  });

  describe('Exposed Ports', function () {

    describe('Adding Ports', function () {

      var mapPorts = function (tags) {
        var values = [];
        for (var ki in tags.tags) {
          values.push(tags.tags[ki].value);
        }
        return values;
      };

      it('should not ade a tag/port with chars', function () {
        var tags = $elScope.portTagOptions.tags;
        var ports = mapPorts(tags);
        $elScope.portTagOptions.tags.addTag('9000');
        $elScope.portTagOptions.tags.addTag('900a'); // Invalid
        $scope.$digest();
        expect(mapPorts(tags)).to.eql(ports.concat(['9000']));
      });

      it('should not add a tag/port with special chars', function () {
        var tags = $elScope.portTagOptions.tags;
        var ports = mapPorts(tags);
        $elScope.portTagOptions.tags.addTag('10000');
        $elScope.portTagOptions.tags.addTag('900!'); // Invalid
        $scope.$digest();
        expect(mapPorts(tags)).to.eql(ports.concat(['10000']));
      });

      it('should not add a tag/port with an invalid port (> 65,535)', function () {
        var tags = $elScope.portTagOptions.tags;
        var ports = mapPorts(tags);
        $elScope.portTagOptions.tags.addTag('65535');
        $elScope.portTagOptions.tags.addTag('65536'); // Invalid
        $elScope.portTagOptions.tags.addTag('99999'); // Invalid
        $scope.$digest();
        expect(mapPorts(tags)).to.eql(ports.concat(['65535']));
      });

      it('should not add a tag/port that is a duplicate', function () {
        var tags = $elScope.portTagOptions.tags;
        var ports = mapPorts(tags);
        $elScope.portTagOptions.tags.addTag('9999');
        $elScope.portTagOptions.tags.addTag('9999'); // Duplicate
        $scope.$digest();
        expect(mapPorts(tags)).to.eql(ports.concat(['9999']));
      });

    });

  });

});
