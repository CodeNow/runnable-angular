/*global runnable:true, mocks: true, directiveTemplate: true, xdescribe: true, helpCardsMock */
'use strict';

describe('editServerModalController'.bold.underline.blue, function () {
  var SMC;
  var ctx;
  var $timeout;
  var $scope;
  var $controller;
  var $rootScope;
  var keypather;
  var loadingService;
  var $q;

  var apiClientMockFactory = require('../../unit/apiMocks/apiClientMockFactory');
  var sourceMocks = runnable.newContexts(require('../../unit/apiMocks/sourceContexts'), {noStore: true, warn: false});
  var apiMocks = require('../apiMocks/index');
  var mockUserFetch = new (require('../fixtures/mockFetch'))();
  var MockFetch = require('../fixtures/mockFetch');
  var cardInfoType = require('card-info-types');

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
      $provide.factory('helpCards', function () {
        ctx.helpCards = helpCardsMock.create(ctx)($q);
        return ctx.helpCards;
      });
      $provide.factory('fetchUser', mockUserFetch.autoTrigger(ctx.fakeOrg1));
      $provide.factory('actions', function () {
        return {
          close: sinon.stub(),
          createAndBuild: sinon.stub(),
        };
      });
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
        containerFiles: [
          new cardInfoType.MainRepository([
            'ADD ["./asdf", "/"]',
            'WORKDIR /',
            'RUN apt-get install'
          ].join('\n'))
        ],
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

      ctx.closeSpy = sinon.spy();

      $provide.factory('ModalService', function ($q) {
        ctx.showModalStub = sinon.stub().returns($q.when({
          close: $q.when(false)
        }));
        return {
          showModal: ctx.showModalStub
        };
      });

      $provide.value('instance', scope.currentModel);
      $provide.value('tab', scope.stateModel);
      $provide.value('close', ctx.closeSpy);

      ctx.loadingPromiseFinishedValue = 0;

      $provide.factory('populateDockerfile', ctx.populateDockerfile.fetch());
      $provide.factory('loadingPromises', function ($q) {
        ctx.loadingPromiseMock = {
          add: sinon.spy(function (namespace, promise) {
            return promise;
          }),
          clear: sinon.spy(),
          count: sinon.stub().returns(0),
          finished: sinon.spy(function () {
            return $q.when(ctx.loadingPromiseFinishedValue);
          })
        };
        return ctx.loadingPromiseMock;
      });
    });
    angular.mock.inject(function (
      _$controller_,
      _$timeout_,
      _$rootScope_,
      _keypather_,
      _$httpBackend_,
      _$templateCache_,
      _loading_,
      _$q_
    ) {
      $controller = _$controller_;
      $timeout = _$timeout_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      loadingService = _loading_;
      $q = _$q_;
    });
    $scope.$digest();
    $scope.stateModel = 'hello';
    sinon.spy(loadingService, 'reset');

    keypather.set($rootScope, 'dataApp.data.activeAccount', ctx.fakeOrg1);

    ctx.closePopoverSpy = sinon.spy();
    $rootScope.$on('close-popovers', ctx.closePopoverSpy);

    angular.extend($scope, scope);
    $scope.$digest();

    SMC = $controller('EditServerModalController', {
      $scope: $scope
    });
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

        SMC.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect(SMC.state.ports).to.be.ok;
        $scope.$digest();
        sinon.assert.notCalled(ctx.build.build);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.closeSpy);

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

        SMC.state.opts.env = ['asdasd', 'sadfsdfasdfasdf'];
        SMC.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect(SMC.state.ports).to.be.ok;
        $scope.$digest();
        sinon.assert.notCalled(ctx.build.build);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.closeSpy);

        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.calledOnce(ctx.instance.redeploy);
      });

      it('should redeploy update the instance when only envs have changed and build is building', function () {
        ctx.instance.status = sinon.stub().returns('building');
        $scope.$digest();

        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Container updated successfully.'
          });
        });

        SMC.state.opts.env = ['asdasd', 'sadfsdfasdfasdf'];
        SMC.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect(SMC.state.ports).to.be.ok;
        sinon.assert.calledOnce(ctx.build.build);
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        sinon.assert.calledOnce(ctx.closeSpy);
        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.notCalled(ctx.instance.redeploy);
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

        SMC.state.opts.env = ['asdasd', 'sadfsdfasdfasdf'];
        SMC.resetStateContextVersion(SMC.instance.contextVersion);
        $scope.$digest();
        SMC.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect(SMC.state.ports).to.be.ok;
        sinon.assert.calledOnce(SMC.openItems.isClean);
        sinon.assert.notCalled(SMC.openItems.updateAllFiles);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.build.build);
        $scope.$digest();
        expect(SMC.state.opts.build).to.be.ok;
        $scope.$digest();
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.closeSpy);

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

        SMC.resetStateContextVersion(SMC.instance.contextVersion);
        $scope.$digest();
        SMC.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect(SMC.state.ports).to.be.ok;
        $scope.$digest();
        sinon.assert.calledOnce(SMC.openItems.updateAllFiles);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.build.build);
        expect(SMC.state.opts.build).to.be.ok;
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        sinon.assert.calledOnce(ctx.closeSpy);
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
        $scope.$digest();
        ctx.loadingPromiseFinishedValue = 2;
        ctx.newContextVersion.fetchFile.reset();
        SMC.state.advanced = true;
        ctx.rollbackContextVersion.attrs.advanced = false;
        SMC.openItems.add.reset();
        loadingService.reset();
        ctx.fakeOrg1.createBuild.reset();
        expect(SMC.state.advanced, 'advanced flag').to.be.ok;
        var oldAcv = SMC.state.acv;
        var oldRepo = SMC.state.repo;
        var oldStartCommand = SMC.state.startCommand;
        var oldSelectedStack = SMC.state.selectedStack;
        var oldContainerFiles = SMC.state.containerFiles;

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
        SMC.resetStateContextVersion(ctx.rollbackContextVersion, true);
        $scope.$digest();
        sinon.assert.called(loadingService.reset);
        expect(SMC.state.advanced, 'advanced flag').to.be.false;
        sinon.assert.called(ctx.loadingPromiseMock.add);
        sinon.assert.called(ctx.rollbackContextVersion.deepCopy);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.rollbackContextVersion.fetchFile);
        sinon.assert.calledOnce(SMC.openItems.remove);
        sinon.assert.calledOnce(SMC.openItems.add);
        $scope.$digest();
        expect(SMC.state.build, 'build').to.be.ok;
        sinon.assert.calledWith(ctx.fakeOrg1.createBuild, {
          contextVersions: [ctx.rollbackContextVersion.id()],
          owner: {
            github: ctx.fakeOrg1.oauthId()
          }
        });
        $scope.$digest();
        sinon.assert.calledOnce(ctx.parseDockerfileResponseMock);
        expect(SMC.state.contextVersion, 'state cv').to.equal(ctx.rollbackContextVersion);
        expect(SMC.state.acv, 'state acv').to.not.equal(oldAcv);
        expect(SMC.state.repo, 'state repo').to.not.equal(oldRepo);
        expect(SMC.state.startCommand, 'state startCommand').to.not.equal(oldStartCommand);
        expect(SMC.state.selectedStack, 'state selectedStack').to.not.equal(oldSelectedStack);
        expect(SMC.state.containerFiles, 'state containerFiles').to.not.equal(oldContainerFiles);

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

        SMC.state.opts.env = ['asdasd', 'sadfsdfasdfasdf'];
        SMC.resetStateContextVersion(SMC.instance.contextVersion);
        $scope.$digest();
        SMC.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect(SMC.state.ports).to.be.ok;
        sinon.assert.calledOnce(SMC.openItems.isClean);
        sinon.assert.notCalled(SMC.openItems.updateAllFiles);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.build.build);
        $scope.$digest();
        expect(SMC.state.opts.build).to.be.ok;
        $scope.$digest();
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.closeSpy);

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
        $scope.$digest();
        SMC.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect(SMC.state.ports).to.be.ok;
        $scope.$digest();
        sinon.assert.calledOnce(SMC.openItems.isClean);
        sinon.assert.calledOnce(SMC.openItems.updateAllFiles);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.build.build);
        expect(SMC.state.opts.build).to.be.ok;
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        sinon.assert.calledOnce(ctx.closeSpy);
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

        SMC.state.opts.env = ['asdasd', 'sadfsdfasdfasdf'];
        SMC.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect(SMC.state.ports).to.be.ok;
        $scope.$digest();
        sinon.assert.notCalled(ctx.build.build);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.closeSpy);

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

    SMC.state.instance.attrs = {
      env: ['quarblax=b']
    };

    var containerFiles = [
      {
        id: 'containerFileID!',
        clone: sinon.spy()
      }
    ];
    SMC.state.containerFiles = containerFiles;

    ctx.loadingPromiseMock.finished = function () {
      return $q.reject(error);
    };

    SMC.getUpdatePromise();

    $scope.$digest();
    sinon.assert.called(ctx.errsMock.handler);
    sinon.assert.calledWith(ctx.errsMock.handler, error);

    $scope.$digest();
    $scope.$digest();
    $rootScope.$apply();
    expect(SMC.state.opts.env.length).to.equal(0);
    expect(SMC.state.containerFiles.length).to.equal(1);
    expect(SMC.state.dockerfile).to.not.equal(ctx.dockerfile);
    expect(SMC.state.dockerfile).to.equal(ctx.anotherDockerfile);

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

      keypather.set(SMC, 'state.advanced', false);
      keypather.set(SMC, 'state.selectedStack', {
        selectedVersion: 'adsfasdfsdf'
      });
      keypather.set(SMC, 'state.startCommand', 'adsasdasd');

      SMC.changeTab('files');
      $scope.$digest();

      expect(SMC.selectedTab).to.equal('files');
    });
    it('should navigate to repository since it has errors', function () {
      $scope.$digest();

      keypather.set(SMC, 'state.advanced', false);
      keypather.set(SMC, 'state.selectedStack', {});
      keypather.set(SMC, 'state.startCommand', 'adsasdasd');

      SMC.changeTab('files');
      $scope.$digest();

      expect(SMC.selectedTab).to.equal('repository');
    });
    it('should navigate to commands since it has errors', function () {
      $scope.$digest();

      keypather.set(SMC, 'state.advanced', false);
      keypather.set(SMC, 'state.selectedStack', {
        selectedVersion: 'adsfasdfsdf'
      });
      keypather.set(SMC, 'state.startCommand', null);

      SMC.changeTab('files');
      $scope.$digest();

      expect(SMC.selectedTab).to.equal('commands');
    });

    it('should navigate fine with advanced mode', function () {
      $scope.editServerForm = {
        $invalid: false
      };
      $scope.$digest();

      keypather.set(SMC, 'state.advanced', true);
      // Digest here since the state.advanced change will trigger a change
      $scope.$digest();
      keypather.set(SMC, 'state.selectedStack', {});
      keypather.set(SMC, 'state.startCommand', null);

      SMC.changeTab('files');
      $scope.$digest();

      expect(SMC.selectedTab).to.equal('files');
    });

    it('should handle invalid editServerForms', function () {
      $scope.$digest();
      SMC.changeTab('logs');
      keypather.set(SMC, 'state.advanced', true);
      keypather.set($scope, 'editServerForm.$invalid', true);
      keypather.set($scope, 'editServerForm.$error.required[0].$name', 'files');
      $scope.$digest();
      SMC.changeTab('files');
      $scope.$digest();
      expect(SMC.selectedTab).to.equal('files');
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
              .to.equal(SMC.isTabVisible(tab));
        });
      });
    });
    it('should change tabs when advanced mode is triggered', function () {
      testingSetups.basic();
      $scope.$digest();
      allTabs.forEach(function (tab) {
        expect(testingObject.basic.indexOf(tab) > -1, 'basic -> tab: ' + tab)
          .to.equal(SMC.isTabVisible(tab));
      });
      SMC.state.advanced = true;
      $scope.$digest();
      allTabs.forEach(function (tab) {
        expect(testingObject.advanced.indexOf(tab) > -1, 'advanced -> tab: ' + tab)
          .to.equal(SMC.isTabVisible(tab));
      });
    });
  });

  describe('Insert Hostname', function () {

    beforeEach(function () {
      setup({
        currentModel: ctx.instance,
        selectedTab: 'env'
      });
    });

    it('should not do anything when no options are passed', function () {
      var spy = sinon.spy();
      var offSpy = $rootScope.$on('eventPasteLinkedInstance', spy);
      SMC.insertHostName();
      expect(spy.callCount).to.equal(0);
      offSpy(); // Remove listener
    });

    it('should insert the protocol when passed', function () {
      var cb = function (eventName, hostName) {
        expect(hostName).to.equal('http://');
      };
      var offCb = $rootScope.$on('eventPasteLinkedInstance', cb);
      SMC.insertHostName({ protocol: 'http://' });
      offCb(); // Remove listener
    });

    it('should insert the port when passed', function () {
      var cb = function (eventName, hostName) {
        expect(hostName).to.equal(':8000');
      };
      var offCb = $rootScope.$on('eventPasteLinkedInstance', cb);
      SMC.insertHostName({
        port: 8000
      });
      offCb(); // Remove listener
    });

    it('should insert the server hostname when passed', function () {
      var server = {
        getElasticHostname: function () {
          return 'hello-world.com';
        }
      };
      var cb = function (eventName, hostName) {
        expect(hostName).to.equal('http://hello-world.com:8000');
      };
      var offCb = $rootScope.$on('eventPasteLinkedInstance', cb);
      SMC.insertHostName({
        protocol: 'http://',
        server: server,
        port: 8000
      });
      offCb(); // Remove listener
    });

  });

  describe('Dockerfile Valid', function () {

    var dockerfileStub = {
      'validation': {
        'criticals': [
          { }, { }
        ]
      }
    };

    beforeEach(function () {
      setup({
        currentModel: ctx.instance,
        selectedTab: 'env'
      });
    });

    it('should correctly determine whether the dockerfile is valid', function () {
      SMC.state.advanced = true;
      SMC.state.dockerfile = dockerfileStub;
      expect(SMC.isDockerfileValid()).to.be.true;
    });

    it('should correctly determine whether the dockerfile is invalid', function () {
      SMC.state.advanced = true;
      SMC.state.dockerfile = dockerfileStub;
      SMC.state.dockerfile.validation.criticals.push({
        message: 'Missing or misplaced FROM'
      });
      expect(SMC.isDockerfileValid()).to.be.false;
    });

  });

  describe('modal closing verification', function () {

    beforeEach(function () {
      setup({
        currentModel: ctx.instance,
        selectedTab: 'env'
      });
    });

    it('should not pop up a confirmation of close when saved', function () {
      SMC.instance.attrs.env = '12345';
      SMC.saveTriggered = true;
      SMC.actions.close();
      $scope.$digest();
      sinon.assert.notCalled(ctx.showModalStub);
      sinon.assert.calledOnce(ctx.closeSpy);
    });

    it('pop up a notification when dirty and being closed', function () {
      SMC.instance.attrs.env = '12345';
      $scope.$digest();
      SMC.actions.close();
      $scope.$digest();
      sinon.assert.calledOnce(ctx.showModalStub);
      sinon.assert.notCalled(ctx.closeSpy);
    });

    it('should resolve when clean', function () {
      SMC.actions.close();
      $scope.$digest();
      sinon.assert.notCalled(ctx.showModalStub);
      sinon.assert.calledOnce(ctx.closeSpy);
    });

  });

  describe('resetStateContextVersion', function () {

    beforeEach(function () {
      setup({
        currentModel: ctx.instance,
        selectedTab: 'env'
      });
    });

    it('should handle errors correctly', function () {
      var testError = new Error('This is a test!');
      ctx.contextVersion.deepCopy.restore();
      sinon.stub(ctx.contextVersion, 'deepCopy', function (cb) {
        cb(testError);
      });
      var promise = SMC.resetStateContextVersion(ctx.contextVersion, true);
      $scope.$digest();
      expect(promise).to.be.rejected;
      expect(promise).to.be.rejectedWith(testError);
    });

    it('should set the `mainRepoContainerFile` if the dockerfile is a main repository', function () {
      SMC.resetStateContextVersion(ctx.contextVersion, false);
      $scope.$digest();
      expect(keypather.get(SMC, 'state.mainRepoContainerFile')).to.be.an('object');
    });

    it('should reset state context version when even is triggered', function () {
      SMC.resetStateContextVersion = sinon.stub().returns($q.when(true));
      $scope.$emit('resetStateContextVersion');
      expect(SMC.resetStateContextVersion.calledOnce).to.be.true;
    });

  });

  describe('Help Cards', function () {

    beforeEach(function () {
      setup({
        currentModel: ctx.instance,
        selectedTab: 'env'
      });
    });

    it('should set the help cards to the scope, depending on the instances', function () {
      $scope.$digest();
      expect(ctx.helpCards.getActiveCard()).to.equal('abc');
    });

  });

});
