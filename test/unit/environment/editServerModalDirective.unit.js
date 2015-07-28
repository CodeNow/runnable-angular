'use strict';

describe('editServerModalDirective'.bold.underline.blue, function () {
  var ctx;
  var $timeout;
  var $scope;
  var $compile;
  var $elScope;
  var $rootScope;
  var keypather;
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

    ctx.openItemsMock = function () {
      this.models = [];
      this.add = sinon.spy();
    };

    ctx.errsMock = {
      handler: sinon.spy()
    };

    angular.mock.module('app', function ($provide) {
      $provide.factory('helpCards', helpCardsMock.create(ctx));
      $provide.factory('fetchUser', mockUserFetch.autoTrigger(ctx.fakeOrg1));
      $provide.value('OpenItems', ctx.openItemsMock);
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
      $provide.factory('parseDockerfileForCardInfoFromInstance', function ($q) {
        return function () {
          return $q.when({
            ports: '80 900 90',
            startCommand: 'hello',
            containerFiles: [],
            commands: [],
            selectedStack: {
              hello: 'cheese'
            }
          });
        };
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
      _$q_
    ) {
      $timeout = _$timeout_;
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      keypather = _keypather_;
      $q = _$q_;
    });
    $scope.defaultActions = {
      close: sinon.spy()
    };
    $scope.stateModel = 'hello';

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
        attrs: apiMocks.appCodeVersions.bitcoinAppCodeVersion
      }
    ];
    ctx.newContextVersion = apiClientMockFactory.contextVersion(
      runnable,
      apiMocks.contextVersions.setup
    );
    ctx.newContextVersion.appCodeVersions.models = [{
      attrs: apiMocks.appCodeVersions.bitcoinAppCodeVersion
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
    sinon.stub(ctx.contextVersion, 'fetch', function (cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.contextVersion);
      });
      return ctx.contextVersion;
    });

    ctx.instance.contextVersion = ctx.contextVersion;

    ctx.dockerfile = {
      attrs: apiMocks.files.dockerfile
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
        cb(null, ctx.dockerfile);
      });
      return ctx.dockerfile;
    });
    sinon.stub(ctx.newContextVersion, 'update', function (opts, cb) {
      $rootScope.$evalAsync(function () {
        cb(null, ctx.newContextVersion);
      });
      return ctx.newContextVersion;
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
      it('should create dockerfile when ports change', function () {
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

        keypather.set($elScope, 'portTagOptions.tags.tags', {0: '123'});
        $elScope.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect($elScope.building).to.be.true;
        expect($elScope.state.ports).to.be.ok;
        $scope.$digest();
        sinon.assert.calledOnce(ctx.build.build);
        expect($elScope.state.opts.build).to.be.ok;
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        sinon.assert.calledOnce($scope.defaultActions.close);
        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.notCalled(ctx.instance.redeploy);
      });
      it('should create dockerfile when packages change', function () {
        var closePopoverSpy = sinon.spy();
        $rootScope.$on('close-popovers', closePopoverSpy);
        $rootScope.$on('alert', function (event, opts) {
          expect(opts).to.be.deep.equal({
            type: 'success',
            text: 'Container updated successfully.'
          });
        });
        ctx.loadingPromiseFinishedValue = 2;

        keypather.set($elScope, 'state.packages.packageList', 'asdf');
        $elScope.getUpdatePromise();
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.loadingPromiseMock.finished);
        expect($elScope.building).to.be.true;
        expect($elScope.state.ports).to.be.ok;

        sinon.assert.calledOnce(ctx.build.build);
        expect($elScope.state.opts.build).to.be.ok;
        sinon.assert.calledOnce(ctx.helpCards.refreshActiveCard);
        sinon.assert.calledOnce($scope.defaultActions.close);
        sinon.assert.calledOnce(ctx.instance.update);
        sinon.assert.notCalled(ctx.instance.redeploy);
      });
      describe('Find and Replace', function () {
        it('should create dockerfile when rules added', function () {
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
          ctx.newContextVersion.appCodeVersions.models[0].transformRules = {
            replace: ['asd'],
            rename: [],
            exclude: []
          };

          $elScope.getUpdatePromise();
          $scope.$digest();
          sinon.assert.called(closePopoverSpy);
          sinon.assert.called(ctx.loadingPromiseMock.finished);
          expect($elScope.building).to.be.true;
          expect($elScope.state.ports).to.be.ok;
          $scope.$digest();
          $scope.$digest();
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

        it('should create dockerfile when rules removed', function () {
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
          ctx.contextVersion.appCodeVersions.models[0].transformRules = {
            replace: ['asd'],
            rename: [],
            exclude: []
          };

          $elScope.getUpdatePromise();
          $scope.$digest();
          sinon.assert.called(closePopoverSpy);
          sinon.assert.called(ctx.loadingPromiseMock.finished);
          expect($elScope.building).to.be.true;
          expect($elScope.state.ports).to.be.ok;
          $scope.$digest();
          $scope.$digest();
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
        it('should not create dockerfile when rules modified', function () {
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
          ctx.contextVersion.appCodeVersions.models[0].transformRules = {
            replace: ['asd'],
            rename: [],
            exclude: []
          };
          ctx.newContextVersion.appCodeVersions.models[0].transformRules = {
            replace: ['dfasdfasdf', 'sadfasdf'],
            rename: ['asdfasdf'],
            exclude: []
          };


          $elScope.state.opts.env = ['asdasd', 'sadfsdfasdfasdf'];
          $elScope.getUpdatePromise();
          $scope.$digest();
          sinon.assert.called(closePopoverSpy);
          sinon.assert.called(ctx.loadingPromiseMock.finished);
          expect($elScope.building).to.be.true;
          expect($elScope.state.ports).to.be.ok;
          $scope.$digest();
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
  describe('advanced flag', function () {
    beforeEach(function () {
      setup({
        currentModel: ctx.instance
      });
    });
    it('should save the change immediately', function () {
      var closePopoverSpy = sinon.spy();
      $rootScope.$on('close-popovers', closePopoverSpy);

      $scope.$digest();
      ctx.loadingPromiseMock.add.reset();
      sinon.assert.notCalled(ctx.loadingPromiseMock.add);
      expect($elScope.state.advanced).to.not.be.ok;
      $elScope.state.advanced = true;
      $scope.$digest();

      sinon.assert.called(closePopoverSpy);
      sinon.assert.called(ctx.loadingPromiseMock.add);
      $scope.$digest();
      sinon.assert.called(ctx.loadingPromiseMock.add);
      sinon.assert.calledWith(ctx.newContextVersion.update, {
        advanced: true
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

    $rootScope.$apply();
    expect($elScope.building, 'Building').to.be.false;
    expect($elScope.state.opts.env.length).to.equal(0);
    expect($elScope.state.containerFiles.length).to.equal(1);
    sinon.assert.calledOnce(containerFiles[0].clone);
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

  describe('updating the dockerfile', function () {
    beforeEach(function () {
      setup({
        currentModel: ctx.instance,
        selectedTab: 'env'
      });
      ctx.contextVersion.attrs.advanced = true;
    });
    describe('file upload popover', function () {
      var closePopoverSpy;
      beforeEach(function () {
        var containerFiles = [
          {
            id: 'containerFileID!',
            clone: sinon.spy()
          }
        ];
        closePopoverSpy = sinon.spy();
        $elScope.state.containerFiles = containerFiles;
        $rootScope.$on('close-popovers', closePopoverSpy);
      });
      it('should update on save', function () {
        var newContainerFile = {
          id: '2345123452',
          clone: sinon.spy()
        };
        sinon.assert.notCalled(ctx.updateDockerfileFromStateMock);
        $elScope.fileUpload.actions.save(newContainerFile);
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        sinon.assert.called(ctx.updateDockerfileFromStateMock);
      });
      it('should update on delete', function () {
        var newContainerFile = {
          id: '2345123452',
          fileModel: {
            destroy: sinon.spy(function (cb) {
              return cb();
            })
          },
          clone: sinon.spy()
        };
        $elScope.state.containerFiles.push(newContainerFile);
        sinon.assert.notCalled(ctx.updateDockerfileFromStateMock);
        $elScope.fileUpload.actions.deleteFile(newContainerFile);
        $scope.$digest();
        sinon.assert.called(closePopoverSpy);
        $scope.$digest();
        sinon.assert.called(ctx.loadingPromiseMock.add);
        sinon.assert.called(ctx.updateDockerfileFromStateMock);
      });
    });
    describe('repository popover', function () {
      var containerFiles;
      var newAppCodeVersion;
      beforeEach(function () {
        newAppCodeVersion = {
          attrs: apiMocks.appCodeVersions.notAbitcoinAppCodeVersion,
          destroy: sinon.spy(function (cb) {
            return cb();
          }),
          update: sinon.spy(function (opts, cb) {
            $rootScope.$evalAsync(function () {
              cb(null, newAppCodeVersion);
            });
            return newAppCodeVersion;
          })
        };
        containerFiles = [
          {
            id: 'containerFileID!',
            clone: sinon.spy(),
            repo: {
              attrs: {
                name: 'cheese'
              }
            }
          }
        ];
        $elScope.state.containerFiles = containerFiles;
        ctx.newContextVersion.appCodeVersions.models.push(newAppCodeVersion);
      });
      it('should update on remove', function () {
        sinon.assert.notCalled(ctx.updateDockerfileFromStateMock);
        $elScope.repositoryPopover.actions.remove(containerFiles[0]);
        $scope.$digest();
        sinon.assert.called(newAppCodeVersion.destroy);
        $scope.$digest();
        sinon.assert.called(ctx.loadingPromiseMock.add);
        sinon.assert.called(ctx.updateDockerfileFromStateMock);
      });
      it('should update on create', function () {
        ctx.newContextVersion.appCodeVersions.create = sinon.spy(function (opts, cb) {
          $rootScope.$evalAsync(function () {
            cb(null, newAppCodeVersion);
          });
          return newAppCodeVersion;
        });
        var newRepo = {
          repo: {
            attrs: {
              full_name: 'cheese'
            }
          },
          branch: {
            attrs: {
              name: '12341234'
            }
          },
          commit: {
            attrs: {
              sha: 'dsfasdgasghas'
            }
          },
          clone: sinon.spy()
        };

        $elScope.repositoryPopover.actions.create(newRepo);
        $scope.$digest();
        sinon.assert.calledWith(ctx.newContextVersion.appCodeVersions.create, {
          repo: 'cheese',
          branch: '12341234',
          commit: 'dsfasdgasghas',
          additionalRepo: true
        });
        $scope.$digest();
        sinon.assert.called(ctx.loadingPromiseMock.add);
        sinon.assert.called(ctx.updateDockerfileFromStateMock);
      });
      it('should update on update', function () {
        sinon.assert.notCalled(ctx.updateDockerfileFromStateMock);
        var newContainerFile = angular.extend({}, containerFiles[0], {
          branch: {
            attrs: {
              name: '12341234'
            }
          },
          commit: {
            attrs: {
              sha: 'dsfasdgasghas'
            }
          },
          acv: newAppCodeVersion
        });
        $elScope.repositoryPopover.actions.update(newContainerFile);
        $scope.$digest();
        sinon.assert.calledWith(newAppCodeVersion.update, {
          branch: '12341234',
          commit: 'dsfasdgasghas'
        });
        $scope.$digest();
        sinon.assert.called(ctx.loadingPromiseMock.add);
        sinon.assert.called(ctx.updateDockerfileFromStateMock);
      });
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
});
