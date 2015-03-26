'use strict';

// injector-provided
var $rootScope,
  $scope,
  $compile,
  $timeout,
  $document,
  $localStorage,
  $state,
  $templateCache;
var $elScope;
var thisUser;
var keypather;

var deepCopyCb;
var buildBuildCb;
var contentsFetchCb;
var instanceUpdateCb;
var errs;

var openItemsIsClean = true;

var apiMocks = require('../../apiMocks/index');
function MockOpenItems() {}


function createBuildObject(json) {
  return {
    attrs: angular.copy(json || apiMocks.builds.setup),
    deepCopy: sinon.spy(function (cb) {
      deepCopyCb = cb;
      return createBuildObject(apiMocks.builds.new);
    }),
    build: sinon.spy(function (opts, cb) {
      buildBuildCb = cb;
      return this;
    }),
    id: function () {
      return this.attrs._id;
    },
    contextVersions: {
      models: [
        {
          rootDir: {
            contents: {
              fetch: function (cb) {
                contentsFetchCb = cb;
              },
              models: [
                {
                  attrs: apiMocks.files.dockerfile
                }
              ]
            }
          },
          fetch: function (cb) {
            cb();
          }
        }
      ]
    }
  };
}
function makeDefaultScope(noInstance) {
  var opts = {
    data: {
      instance: {
        attrs: angular.copy(apiMocks.instances.building),
        update: sinon.spy(function (opts, cb) {
          instanceUpdateCb = cb;
          return;
        })
      },
      build: createBuildObject(),
      instances: {
        models: [
          {
            attrs: angular.copy(apiMocks.instances.building)
          },
          {
            attrs: angular.copy(apiMocks.instances.running)
          }
        ]
      }
    },
    defaultActions: {
      close: sinon.spy(function (cb) {
        cb();
      })
    }
  };
  if (noInstance) {
    delete opts.data.instance;
  }
  return opts;
}

describe('directiveModalEdit'.bold.underline.blue, function () {
  beforeEach(function () {

    MockOpenItems.prototype.add = sinon.spy();
    MockOpenItems.prototype.isClean = sinon.spy(function () {
      return openItemsIsClean;
    });
    MockOpenItems.prototype.removeAndReopen = sinon.spy();

    deepCopyCb = null;
    buildBuildCb = null;
    contentsFetchCb = null;
    instanceUpdateCb = null;

    openItemsIsClean = true;
  });
  var ctx;
  function injectSetupCompile(scope, attrs) {
    errs = {
      handler: sinon.spy()
    };
    angular.mock.module('app', function ($provide) {
      $provide.factory('OpenItems', function () {
        return MockOpenItems;
      });
      $provide.value('eventTracking', {
        triggeredBuild: sinon.spy()
      });
      $provide.value('errs', errs);
      $provide.factory('repoListDirective', function () {
        return {
          priority: 100000,
          terminal: true,
          link: function () {
            // do nothing
          }
        };
      });
      $provide.factory('explorerDirective',  function () {
        return {
          priority: 100000,
          terminal: true,
          link: function () {
            // do nothing
          }
        };
      });
      $provide.factory('activePanelDirective',  function () {
        return {
          priority: 100000,
          terminal: true,
          link: function () {
            // do nothing
          }
        };
      });
    });
    angular.mock.inject(function (
      _$templateCache_,
      _$localStorage_,
      _$compile_,
      _$timeout_,
      _$document_,
      _keypather_,
      _$state_,
      _$rootScope_
    ) {
      $rootScope = _$rootScope_;
      $state = _$state_;
      keypather = _keypather_;
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
      $timeout = _$timeout_;
      $localStorage = _$localStorage_;
      $document = _$document_;
      $templateCache = _$templateCache_;
    });
    if (scope) {
      Object.keys(scope).forEach(function (key) {
        $scope[key] = scope[key];
      });
    }
    $scope.user = thisUser;

    ctx = {};
    var templateAttrs = {
      'data': 'data',
      'default-actions': 'defaultActions'
    };
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        templateAttrs[key] = attrs[key];
      });
    }

    ctx.template = directiveTemplate.attribute('modal-edit', templateAttrs);

    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
  }

  describe('Check that the directive added what it needs to the scope', function () {
    beforeEach(function () {
      injectSetupCompile(makeDefaultScope());
    });
    it('should have everything on the scope that was given', function () {
      expect($elScope.data, 'data').to.be.ok;
      expect($elScope.data.instance, 'data.instance').to.be.ok;
      expect($elScope.defaultActions, 'defaultActions').to.be.ok;
      expect($elScope.defaultActions.close, 'defaultActions.close').to.be.a('function');

      expect($elScope.openItems, 'openItems').to.be.ok;
      expect($elScope.validation, 'validation').to.be.ok;
      expect($elScope.validation.env, 'validation.env').to.be.ok;
      expect($elScope.state, 'state').to.be.ok;
      expect($elScope.state.env, 'state.env').to.be.null;

      expect($elScope.getAllErrorsCount, 'getAllErrorsCount').to.be.a('function');
      expect($elScope.actions, 'actions').to.be.ok;
      expect($elScope.actions.close, 'close').to.be.a('function');
      expect($elScope.actions.buildServer, 'buildServer').to.be.a('function');


      expect($elScope.popoverExposeInstruction, 'popoverExposeInstruction').to.be.ok;
      expect($elScope.popoverExposeInstruction.data, 'popoverExposeInstruction.d').to.be.ok;


      expect($elScope.popoverLinkServers, 'popoverLinkServers').to.be.ok;
      expect($elScope.popoverLinkServers.data, 'popoverLinkServers.d').to.be.ok;
      expect(
        $elScope.popoverLinkServers.data.instanceData,
        'popoverLinkServers.instanceData'
      ).to.equal($elScope.data);
      expect($elScope.popoverLinkServers.data, 'popoverLinkServers.d').to.be.ok;
      expect($elScope.popoverLinkServers.actions, 'popoverLinkServers.a').to.be.ok;
      expect(
        $elScope.popoverLinkServers.actions.pasteDependency,
        'pasteDependency'
      ).to.be.a('function');

      $scope.$destroy();
      $scope.$digest();
    });
  });
  describe('Scope Functions', function () {
    beforeEach(function () {
      injectSetupCompile(makeDefaultScope());
    });
    it('should paste the url for another instance through the scope', function (done) {
      $elScope.$on('eventPasteLinkedInstance', function (event, url) {
        expect(url, 'url').to.equal('nathan-web-codenow.runnableapp.com');
        done();
      });

      var otherInstance = $scope.data.instance;
      keypather.set(otherInstance, 'containers.models[0].urls', function () {
        return ['https://nathan-web-codenow.runnableapp.com:3000'];
      });

      $elScope.popoverLinkServers.actions.pasteDependency(otherInstance);
      $scope.$digest();
    });
    it('should close successfully', function (done) {
      $elScope.dockerfile = {
        validation: {
          errors: []
        }
      };
      $scope.$digest();

      $elScope.actions.close(function () {
        expect($elScope.dockerfile.validation, 'dockerfile validation').to.not.be.ok;
        done();
      });

    });
    it('should close successfully without a dockerfile', function (done) {
      $scope.$digest();

      $elScope.actions.close(function () {
        done();
      });

    });

    it('should skip building if already doing so', function () {
      // Test the dirty flags
      $elScope.building = true;
      var watcherCount = $elScope.$$watchers.length;
      $elScope.actions.buildServer();
      $scope.$digest();

      // if it was cancelled, the dirty watcher will not be added
      expect(watcherCount, 'watcherCount').to.equal($elScope.$$watchers.length);

      $scope.$destroy();
      $scope.$digest();
    });

    it('should build successfully', function () {
      var goStub = sinon.stub($state, 'go');
      deepCopyCb();
      $scope.$digest();
      $scope.$digest();
      contentsFetchCb();
      $scope.$digest();

      keypather.set($elScope, 'state.env', {
        hello: 'hello'
      });
      keypather.set($elScope, 'state.name', 'Cheeseburgers');

      openItemsIsClean = false;
      keypather.set($elScope, 'build.state.dirty', 2);
      // Test the dirty flags
      var watcherCount = $elScope.$$watchers.length;

      $elScope.actions.buildServer();
      $scope.$digest();
      expect($elScope.building, 'building').to.be.true;
      expect(watcherCount + 1, 'watcherCount').to.equal($elScope.$$watchers.length);

      // This should still keep the flow in the watcher, since the build is dirty
      keypather.set($elScope, 'build.state.dirty', 1);
      openItemsIsClean = true;
      $scope.$digest();
      expect(watcherCount + 1, 'watcherCount').to.equal($elScope.$$watchers.length);

      // After this, the watcher should leave
      keypather.set($elScope, 'build.state.dirty', 0);
      $scope.$digest();
      expect(watcherCount, 'watcherCount').to.equal($elScope.$$watchers.length);

      expect(buildBuildCb, 'buildBuildCb').to.be.ok;
      buildBuildCb();
      $scope.$digest();

      expect(instanceUpdateCb, 'instanceUpdateCb').to.be.ok;
      instanceUpdateCb();
      var instanceUpdateCall = $elScope.data.instance.update.getCall(0);
      expect(instanceUpdateCall.args[0], 'instance update 1st arg').to.deep.equal({
        env: {
          hello: 'hello'
        },
        name: 'Cheeseburgers',
        build: $elScope.build.id()
      });
      $scope.$digest();

      expect($elScope.building, 'building').to.be.false;
      sinon.assert.calledOnce($elScope.defaultActions.close);
      $scope.$digest();

      $timeout.flush();
      $scope.$digest();

      expect($state.go.calledWith('instance.instance', {
        instanceName: 'Cheeseburgers'
      }), 'Called instance').to.equal(true);

      $scope.$destroy();
      $scope.$digest();
    });
  });

  describe('Testing buildServer', function () {
    it('should build successfully as normal, then redirect', function () {
      injectSetupCompile(makeDefaultScope());
      var goStub = sinon.stub($state, 'go');
      deepCopyCb();
      $scope.$digest();
      $scope.$digest();
      contentsFetchCb();
      $scope.$digest();

      keypather.set($elScope, 'state.env', {
        hello: 'hello'
      });
      keypather.set($elScope, 'state.name', 'Cheeseburgers');

      openItemsIsClean = false;
      keypather.set($elScope, 'build.state.dirty', 2);
      // Test the dirty flags
      var watcherCount = $elScope.$$watchers.length;

      $elScope.actions.buildServer();
      $scope.$digest();
      expect($elScope.building, 'building').to.be.true;
      expect(watcherCount + 1, 'watcherCount').to.equal($elScope.$$watchers.length);

      // This should still keep the flow in the watcher, since the build is dirty
      keypather.set($elScope, 'build.state.dirty', 1);
      openItemsIsClean = true;
      $scope.$digest();
      expect(watcherCount + 1, 'watcherCount').to.equal($elScope.$$watchers.length);

      // After this, the watcher should leave
      keypather.set($elScope, 'build.state.dirty', 0);
      $scope.$digest();
      expect(watcherCount, 'watcherCount').to.equal($elScope.$$watchers.length);

      expect(buildBuildCb, 'buildBuildCb').to.be.ok;
      buildBuildCb();
      $scope.$digest();

      expect(instanceUpdateCb, 'instanceUpdateCb').to.be.ok;
      instanceUpdateCb();
      var instanceUpdateCall = $elScope.data.instance.update.getCall(0);
      expect(instanceUpdateCall.args[0], 'instance update 1st arg').to.deep.equal({
        env: {
          hello: 'hello'
        },
        name: 'Cheeseburgers',
        build: $elScope.build.id()
      });
      $scope.$digest();

      expect($elScope.building, 'building').to.be.false;
      sinon.assert.calledOnce($elScope.defaultActions.close);
      $scope.$digest();

      $timeout.flush();
      $scope.$digest();

      expect($state.go.calledWith('instance.instance', {
        instanceName: 'Cheeseburgers'
      }), 'Called instance').to.equal(true);

      $scope.$destroy();
      $scope.$digest();
    });
    it('should build successfully as normal, no redirect', function () {
      injectSetupCompile(makeDefaultScope());
      var goStub = sinon.stub($state, 'go');
      deepCopyCb();
      $scope.$digest();
      $scope.$digest();
      contentsFetchCb();
      $scope.$digest();

      openItemsIsClean = false;
      keypather.set($elScope, 'build.state.dirty', 2);
      // Test the dirty flags
      var watcherCount = $elScope.$$watchers.length;

      $elScope.actions.buildServer();
      $scope.$digest();
      expect($elScope.building, 'building').to.be.true;
      expect(watcherCount + 1, 'watcherCount').to.equal($elScope.$$watchers.length);

      // This should still keep the flow in the watcher, since the build is dirty
      keypather.set($elScope, 'build.state.dirty', 1);
      openItemsIsClean = true;
      $scope.$digest();
      expect(watcherCount + 1, 'watcherCount').to.equal($elScope.$$watchers.length);

      // After this, the watcher should leave
      keypather.set($elScope, 'build.state.dirty', 0);
      $scope.$digest();
      expect(watcherCount, 'watcherCount').to.equal($elScope.$$watchers.length);

      expect(buildBuildCb, 'buildBuildCb').to.be.ok;
      buildBuildCb();
      $scope.$digest();

      expect(instanceUpdateCb, 'instanceUpdateCb').to.be.ok;
      instanceUpdateCb();
      var instanceUpdateCall = $elScope.data.instance.update.getCall(0);
      expect(instanceUpdateCall.args[0], 'instance update 1st arg').to.deep.equal({
        build: $elScope.build.id()
      });
      $scope.$digest();
      $timeout.flush();

      expect($elScope.building, 'building').to.be.false;
      sinon.assert.calledOnce($elScope.defaultActions.close);
      $scope.$digest();

      $timeout.verifyNoPendingTasks();
      $scope.$digest();

      sinon.assert.notCalled($state.go);

      $scope.$destroy();
      $scope.$digest();
    });
  });

  describe('basic functionality', function () {
    it('should flow normally', function () {
      injectSetupCompile({
        data: {}
      });
      expect($elScope.state.name, 'state.name').to.not.be.ok;

      var newScope = makeDefaultScope();
      $scope.data = {
        instance: newScope.data.instance,
        build: newScope.data.build
      };
      $scope.$digest();
      expect($elScope.state.name, 'state.name').to.equal(newScope.data.instance.attrs.name);

      expect($elScope.build, 'scope build').to.not.be.ok;
      deepCopyCb();
      $scope.$digest();

      expect($elScope.build, 'Scope build').to.be.ok;
      expect($elScope.build, 'Scope build').to.not.equal($elScope.data.build);
      $scope.$digest();

      contentsFetchCb();
      $scope.$digest();

      expect($elScope.dockerfile, 'dockerfile').to.be.ok;

      sinon.assert.calledOnce($elScope.openItems.add);
      $scope.$destroy();
      $scope.$digest();
    });


    it('should flow normally when in setup mode', function () {
      injectSetupCompile({
        data: {}
      }, {
        setup: 'true'
      });
      expect($elScope.state.name, 'state.name').to.not.be.ok;

      var newScope = makeDefaultScope();
      $scope.data = {
        build: newScope.data.build
      };
      $scope.$digest();
      expect($elScope.state.name, 'state.name').to.not.be.ok;

      $scope.$destroy();
      $scope.$digest();
    });
  });

  describe('Testing failures', function () {
    it('should error when a rootDir is not found', function () {
      injectSetupCompile({
        data: {}
      });
      expect($elScope.state.name, 'state.name').to.not.be.ok;

      var newScope = makeDefaultScope();
      $scope.data = {
        instance: newScope.data.instance,
        build: newScope.data.build
      };
      $scope.data.build.deepCopy = sinon.spy(function (cb) {
        deepCopyCb = cb;
        var copiedBuild = createBuildObject(apiMocks.builds.new);
        delete copiedBuild.contextVersions.models[0].rootDir;
        return copiedBuild;
      });
      $scope.$digest();
      expect($elScope.state.name, 'state.name').to.equal(newScope.data.instance.attrs.name);

      expect($elScope.build, 'scope build').to.not.be.ok;
      deepCopyCb();
      $scope.$digest();

      sinon.assert.calledWith(errs.handler, new Error('rootDir not found'));
      expect(contentsFetchCb, 'contentsFetchCb').to.not.be.ok;
      $scope.$destroy();
      $scope.$digest();
    });
    it('should recopy the build when buildServer fails', function () {
      injectSetupCompile(makeDefaultScope());
      sinon.assert.calledOnce($elScope.data.build.deepCopy);
      $elScope.data.build.deepCopy.reset();
      deepCopyCb();
      $scope.$digest();
      $scope.$digest();
      contentsFetchCb();
      $scope.$digest();

      keypather.set($elScope, 'state.env', {
        hello: 'hello'
      });
      keypather.set($elScope, 'state.name', 'Cheeseburgers');


      $elScope.actions.buildServer();
      $scope.$digest();
      expect($elScope.building, 'building').to.be.true;
      $scope.$digest();

      $scope.$digest();

      sinon.assert.calledOnce($elScope.build.build);
      buildBuildCb();
      $scope.$digest();

      // Change the deepCopy so the failure case produces a different one
      $elScope.build.deepCopy = sinon.spy(function (cb) {
        deepCopyCb = cb;
        return createBuildObject(apiMocks.builds.setup);
      });

      var error = new Error('Hello');
      instanceUpdateCb(error);
      $scope.$digest();

      // ------ Failure happens here ------ Test that the recovery succeeded

      sinon.assert.calledWith(errs.handler, error);
      $scope.$digest();

      sinon.assert.calledOnce($elScope.build.deepCopy);
      deepCopyCb();
      $scope.$digest();
      expect($elScope.build.contextVersions.models[0].rootDir.state.open, 'rootDir').to.be.true;

      $scope.$digest();

      sinon.assert.calledOnce($elScope.openItems.removeAndReopen);
      $scope.$digest();
      expect($elScope.building, 'building').to.be.false;

      $scope.$destroy();
      $scope.$digest();
    });

  });

});
