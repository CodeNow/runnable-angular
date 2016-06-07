/*global runnable:true, mocks: true, directiveTemplate: true, xdescribe: true, helpCardsMock */
'use strict';

describe('editServerModalController'.bold.underline.blue, function () {
  var SMC;
  var ctx;
  var $q;
  var $timeout;
  var $scope;
  var $controller;
  var $rootScope;
  var keypather;
  var loadingService;

  var apiClientMockFactory = require('../../unit/apiMocks/apiClientMockFactory');
  var sourceMocks = runnable.newContexts(require('../../unit/apiMocks/sourceContexts'), {noStore: true, warn: false});
  var apiMocks = require('../apiMocks/index');
  var mockUserFetch = new (require('../fixtures/mockFetch'))();
  var MockFetch = require('../fixtures/mockFetch');
  var cardInfoType = require('card-info-types');

  var returnArg = function (returnArg, callbackArg) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      var cb = args[args.length - 1]; // The callback will be the last argument
      $rootScope.$evalAsync(function () {
        if (callbackArg !== undefined) {
          cb(null, callbackArg);
        } else {
          cb(null, returnArg);
        }
      });
      return returnArg;
    };
  };

  beforeEach(function () {
    ctx = {};
  });

  function setup(scope) {
    scope  = scope || {};
    scope = angular.extend({
      currentModel: ctx.instance
    }, scope);

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
      $provide.factory('createBuildFromContextVersionId', function () {
        ctx.createBuildFromContextVersionId = sinon.stub().returns($q.when(ctx.build));
        return ctx.createBuildFromContextVersionId;
      });
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
          this.removeAndReopen = sinon.stub();
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
        ctx.updateDockerfileFromStateMock.returns($q.when(true));
        return ctx.updateDockerfileFromStateMock;
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
          start: sinon.stub().returnsArg(1),
          count: sinon.spy(function () {
            return ctx.loadingPromiseFinishedValue;
          }),
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
    ctx.contextVersion.getMainAppCodeVersion = sinon.stub()
      .returns(ctx.contextVersion.appCodeVersions.models[0]);
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
    ctx.newContextVersion.getMainAppCodeVersion = sinon.stub()
      .returns(ctx.newContextVersion.appCodeVersions.models[0]);
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



    sinon.stub(ctx.contextVersion, 'deepCopy', returnArg(ctx.newContextVersion));
    sinon.stub(ctx.newContextVersion, 'deepCopy', returnArg(ctx.contextVersion));
    sinon.stub(ctx.rollbackContextVersion, 'deepCopy', returnArg(ctx.contextVersion));

    sinon.stub(ctx.contextVersion, 'fetch', returnArg(ctx.contextVersion));
    sinon.stub(ctx.newContextVersion, 'fetch', returnArg(ctx.newContextVersion));
    sinon.stub(ctx.rollbackContextVersion, 'fetch', returnArg(ctx.rollbackContextVersion));

    sinon.stub(ctx.contextVersion, 'fetchFile', returnArg(ctx.anotherDockerfile));
    sinon.stub(ctx.newContextVersion, 'fetchFile', returnArg(ctx.dockerfile));
    sinon.stub(ctx.rollbackContextVersion, 'fetchFile', returnArg(ctx.anotherDockerfile));

    sinon.stub(ctx.contextVersion, 'update', returnArg(ctx.contextVersion));
    sinon.stub(ctx.newContextVersion, 'update', returnArg(ctx.newContextVersion));
    sinon.stub(ctx.rollbackContextVersion, 'update', returnArg(ctx.rollbackContextVersion));

    ctx.build = apiClientMockFactory.build(runnable, apiMocks.contextVersions.running);
    ctx.build.contextVersions = {
      models: [ctx.newContextVersion]
    };

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
            text: 'Changes Saved'
          });
        });
        $scope.$digest();
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

        sinon.assert.notCalled(ctx.instance.update);
        sinon.assert.notCalled(ctx.instance.redeploy);
      });

      it('should redeploy update the instance when only envs have changed and build is building', function () {
        ctx.instance.status = sinon.stub().returns('building');
        $scope.$digest();

        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Changes Saved'
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
        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.notCalled(ctx.instance.redeploy);
        sinon.assert.called(ctx.loadingPromiseMock.clear);
      });

      it('should build when promises have been made', function () {
        var alertSpy = sinon.spy();
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Changes Saved'
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
            text: 'Changes Saved'
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
            text: 'Changes Saved'
          });
        });
        ctx.loadingPromiseFinishedValue = 2;
        SMC.state.advanced = true;
        ctx.rollbackContextVersion.attrs.advanced = false;
        ctx.newContextVersion.fetchFile.reset();
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

        // Force a digest and reset all stubs so we can isolate the function
        // calls for `resetStateContextVersion`
        $scope.$digest();
        ctx.parseDockerfileResponseMock.reset();
        ctx.contextVersion.fetchFile.reset();
        SMC.openItems.remove.reset();
        SMC.openItems.add.reset();

        // `resetStateContextVersion` will reset the context version to `ctx.contextVersion`
        SMC.resetStateContextVersion(ctx.rollbackContextVersion, true);
        $scope.$digest();
        sinon.assert.called(loadingService.reset);
        expect(SMC.state.advanced, 'advanced flag').to.be.false;
        sinon.assert.called(ctx.loadingPromiseMock.start);
        sinon.assert.called(ctx.rollbackContextVersion.deepCopy);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.contextVersion.fetchFile);
        sinon.assert.calledOnce(SMC.openItems.remove);
        sinon.assert.called(SMC.openItems.add);
        $scope.$digest();
        expect(SMC.state.build, 'build').to.be.ok;
        sinon.assert.calledWith(ctx.createBuildFromContextVersionId, ctx.contextVersion.id());
        $scope.$digest();
        sinon.assert.calledOnce(ctx.parseDockerfileResponseMock);
        expect(SMC.state.contextVersion, 'state cv').to.equal(ctx.contextVersion);
        expect(SMC.state.acv, 'state acv').to.not.equal(oldAcv);
        expect(SMC.state.repo, 'state repo').to.not.equal(oldRepo);
        expect(SMC.state.startCommand, 'state startCommand').to.not.equal(oldStartCommand);
        expect(SMC.state.selectedStack, 'state selectedStack').to.not.equal(oldSelectedStack);
        expect(SMC.state.containerFiles, 'state containerFiles').to.not.equal(oldContainerFiles);

      });
      it('should not parse dockerfile with an advanced cv', function () {
        var alertSpy = sinon.spy();
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Changes Saved'
          });
        });
        $scope.$digest();
        ctx.loadingPromiseFinishedValue = 2;
        ctx.newContextVersion.fetchFile.reset();

        SMC.state.advanced = false;
        ctx.rollbackContextVersion.attrs.advanced = true;

        SMC.openItems.add.reset();
        loadingService.reset();
        ctx.fakeOrg1.createBuild.reset();
        expect(SMC.state.advanced, 'advanced flag').to.be.false;
        var oldAcv = SMC.state.acv;
        var oldRepo = SMC.state.repo;

        var newContainerFile = {
          name: 'hello',
          clone: sinon.spy(function () {
            return newContainerFile;
          })
        };

        // Force a digest and reset all stubs so we can isolate the function
        // calls for `resetStateContextVersion`
        $scope.$digest();
        ctx.parseDockerfileResponseMock.reset();
        ctx.contextVersion.fetchFile.reset();
        SMC.openItems.remove.reset();
        SMC.openItems.add.reset();

        // `resetStateContextVersion` will reset the context version to `ctx.contextVersion`
        SMC.resetStateContextVersion(ctx.rollbackContextVersion, true);
        $scope.$digest();
        sinon.assert.called(loadingService.reset);
        expect(SMC.state.advanced, 'advanced flag').to.be.true;
        sinon.assert.called(ctx.loadingPromiseMock.start);
        sinon.assert.called(ctx.rollbackContextVersion.deepCopy);
        $scope.$digest();
        sinon.assert.calledOnce(ctx.contextVersion.fetchFile);
        sinon.assert.calledOnce(SMC.openItems.remove);
        sinon.assert.calledOnce(SMC.openItems.add);
        $scope.$digest();
        expect(SMC.state.build, 'build').to.be.ok;
        sinon.assert.calledWith(ctx.createBuildFromContextVersionId, ctx.contextVersion.id());
        $scope.$digest();
        sinon.assert.notCalled(ctx.parseDockerfileResponseMock);
        expect(SMC.state.contextVersion, 'state cv').to.equal(ctx.contextVersion);
        expect(SMC.state.acv, 'state acv').to.not.equal(oldAcv);
        expect(SMC.state.repo, 'state repo').to.not.equal(oldRepo);

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
            text: 'Changes Saved'
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
            text: 'Changes Saved'
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
        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.notCalled(ctx.instance.redeploy);
      });
    });
  });

  it('resets the state properly on a build error', function (done) {
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

    ctx.loadingPromiseFinishedValue = 2;
    ctx.build.build.restore();
    sinon.stub(ctx.build, 'build', function (opts, cb) {
      return cb(error);
    });
    SMC.state.build = ctx.build;
    ctx.loadingPromiseMock.add.reset();
    ctx.loadingPromiseMock.clear.reset();

    SMC.getUpdatePromise()
      .catch(function (e) {
        expect(e, 'error').to.equal(error);
        sinon.assert.notCalled(ctx.errsMock.handler);

        expect(SMC.state.opts.env.length).to.equal(0);
        expect(SMC.state.containerFiles.length).to.equal(1);

        // No longer need to clone after the original time
        //sinon.assert.calledOnce(containerFiles[0].clone);
        sinon.assert.calledOnce(SMC.state.contextVersion.deepCopy);
        sinon.assert.calledOnce(ctx.newContextVersion.deepCopy);
        sinon.assert.calledOnce(ctx.contextVersion.fetch);

        expect(SMC.state.dockerfile).to.not.equal(ctx.dockerfile);
        expect(SMC.state.dockerfile).to.equal(ctx.anotherDockerfile);

        sinon.assert.calledTwice(ctx.loadingPromiseMock.clear);
        sinon.assert.calledOnce(ctx.loadingPromiseMock.add);
        done();
      });


    $scope.$digest();
    $rootScope.$apply();

  });

  it('resets the state properly on an update error', function (done) {
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
    ctx.loadingPromiseFinishedValue = 0;
    ctx.loadingPromiseMock.add.reset();
    ctx.loadingPromiseMock.clear.reset();
    sinon.stub(SMC, 'resetStateContextVersion').returns($q.when(true));
    SMC.getUpdatePromise()
      .catch(function (e) {
        expect(e, 'error').to.equal(error);
        sinon.assert.notCalled(ctx.errsMock.handler);
        sinon.assert.notCalled(SMC.resetStateContextVersion);

        sinon.assert.calledOnce(ctx.loadingPromiseMock.clear);
        sinon.assert.notCalled(ctx.loadingPromiseMock.add);
        done();
      });

    $scope.$digest();
  });

  it('resets the state properly on an update error, when the build deduped the cv', function (done) {
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
    ctx.build.build.restore();
    ctx.loadingPromiseFinishedValue = 2;

    ctx.build2 = apiClientMockFactory.build(runnable, apiMocks.contextVersions.setup);
    ctx.build2.contextVersions.models = [ctx.contextVersion];

    sinon.stub(ctx.build, 'build', returnArg(ctx.build2));
    SMC.state.build = ctx.build;
    ctx.instance.update.restore();
    sinon.stub(ctx.instance, 'update', function (opts, cb) {
      return cb(error);
    });
    ctx.loadingPromiseMock.add.reset();
    ctx.loadingPromiseMock.clear.reset();
    sinon.stub(SMC, 'resetStateContextVersion').returns($q.when(true));
    SMC.getUpdatePromise()
      .catch(function (e) {
        expect(e, 'error').to.equal(error);
        sinon.assert.notCalled(ctx.errsMock.handler);
        sinon.assert.calledOnce(SMC.resetStateContextVersion);
        expect(SMC.resetStateContextVersion.getCall(0).notCalledWith(ctx.newContextVersion, false), 'not called with newCV').to.be.true;
        expect(SMC.resetStateContextVersion.getCall(0).calledWith(ctx.contextVersion, false), 'called with cv').to.be.true;

        sinon.assert.calledTwice(ctx.loadingPromiseMock.clear);
        sinon.assert.calledOnce(ctx.loadingPromiseMock.add);
        done();
      });

    $scope.$digest();
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
          ctx.instance.contextVersion.getMainAppCodeVersion.returns(false);
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
        },
        mirror: function () {
          ctx.instance.contextVersion.attrs.advanced = true;
          ctx.instance.contextVersion.attrs.buildDockerfilePath = 'isMirroringDockerfile';
          setup({
            currentModel: ctx.instance
          });
        }
      };
    });
    var testingObject = {
      basic: [
        'repository', 'ports', 'env', 'commands', 'files', 'translation', 'buildfiles', 'logs'
      ],
      nonRepoAdvanced: [
        'buildfiles', 'env', 'logs'
      ],
      advanced: [
        'repository', 'buildfiles', 'env', 'translation', 'logs'
      ],
      mirror: [
        'repository', 'buildfiles', 'env', 'logs'
      ]
    };
    Object.keys(testingObject).forEach(function (key) {
      it('should show the correct tabs for a ' + key + ' instance', function () {
        testingSetups[key]();
        $scope.$digest();
        allTabs.forEach(function (tab) {
          expect(testingObject[key].includes(tab), key + ' -> tab: ' + tab)
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

  describe('modal closing verification', function () {

    beforeEach(function () {
      setup({
        currentModel: ctx.instance,
        selectedTab: 'env'
      });
    });

    it('should not pop up a confirmation of close when saved', function () {
      SMC.instance.attrs.env = '12345';
      SMC.isDirty = sinon.stub().returns(false);
      SMC.actions.close();
      $scope.$digest();
      sinon.assert.notCalled(ctx.showModalStub);
      sinon.assert.calledOnce(ctx.closeSpy);
    });

    it('pop up a notification when dirty and being closed', function () {
      SMC.instance.attrs.env = '12345';
      SMC.isDirty = sinon.stub().returns(true);
      $scope.$digest();
      SMC.actions.close();
      $scope.$digest();
      sinon.assert.calledOnce(ctx.showModalStub);
      sinon.assert.notCalled(ctx.closeSpy);
    });

    it('should allow the user to build from the popup', function () {
      SMC.isDirty = sinon.stub().returns('build');
      sinon.stub(SMC, 'getUpdatePromise').returns($q.when(true));
      ctx.showModalStub.returns($q.when({
        close: $q.when('build')
      }));
      ctx.loadingPromiseMock.clear.reset();
      $scope.$digest();
      SMC.actions.close();
      $scope.$digest();
      sinon.assert.calledOnce(ctx.showModalStub);
      sinon.assert.calledOnce(SMC.getUpdatePromise);
      $scope.$digest();
      sinon.assert.calledOnce(ctx.closeSpy);
      expect(loadingService.editServerModal).to.be.not.ok;
    });

    it('should allow the user to just close the modal', function () {
      SMC.isDirty = sinon.stub().returns('update');
      sinon.stub(SMC, 'getUpdatePromise').returns($q.when(true));
      ctx.showModalStub.returns($q.when({
        close: $q.when(true)
      }));
      ctx.loadingPromiseMock.clear.reset();
      $scope.$digest();
      SMC.actions.close();
      $scope.$digest();
      sinon.assert.calledOnce(ctx.showModalStub);
      sinon.assert.notCalled(SMC.getUpdatePromise);
      $scope.$digest();
      sinon.assert.calledOnce(ctx.closeSpy);
      expect(loadingService.editServerModal).to.be.not.ok;
    });

    it('should handle if the rebuild from the popover fails', function () {
      SMC.isDirty = sinon.stub().returns('build');
      var error = new Error('an error');
      sinon.stub(SMC, 'getUpdatePromise').returns($q.reject(error));
      ctx.showModalStub.returns($q.when({
        close: $q.when('build')
      }));
      ctx.loadingPromiseMock.clear.reset();
      $scope.$digest();
      SMC.actions.close();
      $scope.$digest();
      sinon.assert.calledOnce(ctx.showModalStub);
      sinon.assert.calledOnce(SMC.getUpdatePromise);
      $scope.$digest();
      sinon.assert.notCalled(ctx.closeSpy);
      sinon.assert.calledOnce(ctx.errsMock.handler);
      expect(loadingService.editServerModal).to.be.not.ok;
    });

    it('should not allow a build if the form is invalid', function () {
      SMC.isDirty = sinon.stub().returns('build');
      var error = new Error('an error');
      sinon.stub(SMC, 'getUpdatePromise').returns($q.reject(error));
      ctx.showModalStub.returns($q.when({
        close: $q.when('build')
      }));
      keypather.set(SMC, 'serverForm.$invalid', true);
      ctx.loadingPromiseMock.clear.reset();
      $scope.$digest();
      SMC.actions.close();
      $scope.$digest();
      sinon.assert.calledOnce(ctx.showModalStub);
      sinon.assert.notCalled(SMC.getUpdatePromise);
      sinon.assert.notCalled(ctx.closeSpy);
      expect(loadingService.editServerModal).to.be.not.ok;
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

    it('should add the promise to loadingPromises.start', function () {
      SMC.resetStateContextVersion(ctx.contextVersion, false);
      $scope.$digest();
      sinon.assert.called(ctx.loadingPromiseMock.start);
    });
  });

  describe('Rebuild', function () {
    beforeEach(function () {
      setup({
        currentModel: ctx.instance
      });
    });

    it('should start loading when the rebuild command is executed and stop loading when finished', function () {
      $scope.$digest();
      expect($rootScope.isLoading[SMC.name]).to.be.false;
      SMC.rebuild();
      expect($rootScope.isLoading[SMC.name]).to.be.true;
      $scope.$digest();
      expect($rootScope.isLoading[SMC.name]).to.be.false;
    });

    it('should reset the context version, stop loading and clear all promises', function () {
      SMC.resetStateContextVersion = sinon.stub().returns($q.when(true));
      SMC.rebuildAndOrRedeploy = sinon.stub().returns($q.when(true));

      SMC.rebuild();
      expect($rootScope.isLoading[SMC.name]).to.be.true;
      $scope.$digest();
      sinon.assert.calledOnce(SMC.resetStateContextVersion);
      sinon.assert.calledOnce(SMC.rebuildAndOrRedeploy);
      expect($rootScope.isLoading[SMC.name]).to.be.false;
    });

    it('should handle the error and stop loading if the context version cannot be reset', function () {
      SMC.rebuildAndOrRedeploy = sinon.stub().returns($q.reject(new Error('rebuildAndOrRedeploy error')));

      SMC.rebuild();
      $scope.$digest();
      sinon.assert.calledOnce(SMC.rebuildAndOrRedeploy);
      sinon.assert.calledOnce(ctx.errsMock.handler);
      expect($rootScope.isLoading[SMC.name]).to.be.false;
    });
  });

  describe('updateInstanceAndReset', function () {
    beforeEach(function () {
      setup({
        currentModel: ctx.instance
      });
    });

    it('should reset the context version after successfully updating', function () {
      SMC.resetStateContextVersion = sinon.stub().returns($q.when(true));
      SMC.getUpdatePromise = sinon.stub().returns($q.when(true));

      SMC.updateInstanceAndReset();
      $scope.$digest();
      sinon.assert.calledOnce(SMC.resetStateContextVersion);
      sinon.assert.calledOnce(SMC.getUpdatePromise);
    });

    it('should not handle the error if it happens during the update', function (done) {
      var error = new Error('rebuildAndOrRedeploy error');
      SMC.getUpdatePromise = sinon.stub().returns($q.reject(error));
      SMC.resetStateContextVersion = sinon.stub().returns($q.when(true));

      SMC.updateInstanceAndReset()
        .catch(function (err) {
          expect(err).to.equal(error);
          sinon.assert.calledOnce(SMC.getUpdatePromise);
          sinon.assert.notCalled(SMC.resetStateContextVersion);
          sinon.assert.notCalled(ctx.errsMock.handler);
          done();
        });
      $scope.$digest();
    });
  });

  describe('Ports', function () {

    beforeEach(function () {
      setup({
        currentModel: ctx.instance,
        selectedTab: 'env'
      });
    });

    it('should correctly update the dockerfile when the ports have changed ', function () {
      $scope.$digest();
      ctx.loadingPromiseMock.add.reset();
      SMC.state.ports = ['20', '12321'];
      $scope.$digest();
      sinon.assert.calledOnce(ctx.loadingPromiseMock.add);
      sinon.assert.calledOnce(ctx.updateDockerfileFromStateMock);
      sinon.assert.calledWith(
        ctx.updateDockerfileFromStateMock,
        SMC.state
      );
      sinon.assert.calledWith(
        ctx.loadingPromiseMock.add,
        'editServerModal',
        ctx.updateDockerfileFromStateMock()
      );
    });

  });
  describe('Env change', function () {

    beforeEach(function () {
      setup({
        currentModel: ctx.instance,
        selectedTab: 'env'
      });
    });

    it('should correctly update the dockerfile when the envs have changed ', function () {
      $scope.$digest();
      ctx.loadingPromiseMock.add.reset();
      SMC.state.opts.env = ['asdasd=123'];
      $scope.$digest();
      sinon.assert.calledOnce(ctx.updateDockerfileFromStateMock);
      sinon.assert.calledOnce(ctx.loadingPromiseMock.add);
      sinon.assert.calledWith(
        ctx.updateDockerfileFromStateMock,
        SMC.state
      );
      ctx.updateDockerfileFromStateMock.reset();
      SMC.state.opts.env = ['asdasd=123', 'asdasdas=1'];
      $scope.$digest();
      sinon.assert.calledOnce(ctx.updateDockerfileFromStateMock);
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

  describe('isTabVisible', function () {
    beforeEach(function () {
      setup({
        currentModel: ctx.instance,
        selectedTab: 'env'
      });
    });

    it('should return false for an undefined tab', function () {
      expect(SMC.isTabVisible('thingthatdoesntexist')).to.equal(false);
      expect(SMC.isTabVisible('thiasdfng')).to.equal(false);
    });

    it('should return false for a feature flag that is disabled', function () {
      SMC.state.advanced = true;
      keypather.set($rootScope, 'featureFlags.whitelist', true);
      expect(SMC.isTabVisible('whitelist')).to.equal(true);
      keypather.set($rootScope, 'featureFlags.whitelist', false);
      expect(SMC.isTabVisible('whitelist')).to.equal(false);
    });

    it('should return the correct state when in advanced mode', function () {
      SMC.state.advanced = true;
      expect(SMC.isTabVisible('ports')).to.equal(false);
      expect(SMC.isTabVisible('buildfiles')).to.equal(true);
      expect(SMC.isTabVisible('files')).to.equal(false);
    });

    it('should all return true if in basic mode', function () {
      SMC.state.advanced = false;
      expect(SMC.isTabVisible('repository')).to.equal(true);
      expect(SMC.isTabVisible('ports')).to.equal(true);
      expect(SMC.isTabVisible('buildfiles')).to.equal(true);
      expect(SMC.isTabVisible('files')).to.equal(true);
      expect(SMC.isTabVisible('logs')).to.equal(true);
    });

    it('should all return false for some if dealing with a non-repo container', function () {
      SMC.state.advanced = false;
      SMC.instance.contextVersion.getMainAppCodeVersion.returns(false);
      expect(SMC.isTabVisible('repository')).to.equal(false);
      expect(SMC.isTabVisible('ports')).to.equal(false);
      expect(SMC.isTabVisible('buildfiles')).to.equal(true);
      expect(SMC.isTabVisible('files')).to.equal(false);
      expect(SMC.isTabVisible('logs')).to.equal(true);
    });
  });

  describe('needsToBeDirtySaved', function () {
    beforeEach(setup.bind(null, {}));

    it('should return true', function () {
      expect(SMC.needsToBeDirtySaved()).to.equal(true);
    });
  });

  describe('isPrimaryButtonDisabled', function () {
    beforeEach(setup.bind(null, {}));

    it('should return false if in advanced mode', function () {
      SMC.state.advanced = true;
      expect(SMC.isPrimaryButtonDisabled()).to.equal(false);
    });

    it('should return true if there is not selected stack', function () {
      SMC.state.advanced = false;
      SMC.state.selectedStack = false;
      expect(SMC.isPrimaryButtonDisabled()).to.equal(true);
    });

    it('should return false if the stack is valid', function () {
      SMC.state.advanced = false;
      SMC.state.selectedStack = true;
      expect(SMC.isPrimaryButtonDisabled(false)).to.equal(false);
    });

    it('should return false if the there is a selected stack', function () {
      SMC.state.advanced = false;
      SMC.state.selectedStack = true;
      expect(SMC.isPrimaryButtonDisabled(false)).to.equal(false);
    });

    it('should return true if the stack is invalid', function () {
      SMC.state.advanced = false;
      SMC.state.selectedStack = true;
      expect(SMC.isPrimaryButtonDisabled(true)).to.equal(true);
    });
  });

 describe('$on resetStateContextVersion', function () {
    beforeEach(setup.bind(null, {}));
    beforeEach(function () {
      SMC.resetStateContextVersion = sinon.stub().returns($q.when(true));
    });

    it('should load if it should show the spinner', function () {
      $scope.$digest();
      $scope.$emit('resetStateContextVersion', ctx.contextVersion, true);
      expect($rootScope.isLoading.editServerModal).to.equal(true);
      $scope.$digest();
      $scope.$digest();
      expect($rootScope.isLoading.editServerModal).to.equal(false);
    });

    it('should not load if it should show not the spinner', function () {
      $scope.$emit('resetStateContextVersion', ctx.contextVersion, false);
      $scope.$digest();
      expect($rootScope.isLoading.editServerModal).to.equal(false);
    });

    it('should reset the context version', function () {
      $scope.$emit('resetStateContextVersion', ctx.contextVersion, true);
      $scope.$digest();
      sinon.assert.calledOnce(SMC.resetStateContextVersion);
      sinon.assert.notCalled(ctx.errsMock.handler);
    });

    it('should handle errors', function () {
      SMC.resetStateContextVersion.returns($q.reject(true));

      $scope.$emit('resetStateContextVersion', ctx.contextVersion, true);
      $scope.$digest();
      sinon.assert.calledOnce(SMC.resetStateContextVersion);
      sinon.assert.calledOnce(ctx.errsMock.handler);
    });
  });

  describe('$on debug-cmd-status', function () {
    beforeEach(setup.bind(null, {}));

    it('should be true', function () {
      $scope.$emit('debug-cmd-status', true);
      $scope.$digest();
      expect(SMC.showDebugCmd).to.equal(true);
    });

    it('should be false', function () {
      $scope.$emit('debug-cmd-status', false);
      $scope.$digest();
      expect(SMC.showDebugCmd).to.equal(false);
    });
  });

  describe('startCommand', function () {
    beforeEach(setup.bind(null, {}));
    beforeEach(function () {
      keypather.set(
        SMC,
        'instance.containers.models[0].attrs.inspect.Config.Cmd[2]',
        'until grep -q ethwe /proc/net/dev; do sleep 1; done;sleep 1'
      );
    });

    it('should replace the command', function () {
      expect(SMC.startCommand()).to.equal('sleep 1');
    });

    it('should handle not having a command', function () {
      keypather.set(
        SMC,
        'instance.containers.models[0].attrs.inspect.Config.Cmd[2]',
        null
      );
      expect(SMC.startCommand()).to.equal('');
    });
  });
});
