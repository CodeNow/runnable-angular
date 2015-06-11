'use strict';
describe.only('editServerModalDirective'.bold.underline.blue, function () {
  var ctx;
  var $timeout;
  var $scope;
  var $compile;
  var $elScope;
  var $rootScope;
  var keypather;
  var $q;

  var apiClientMockFactory = require('../../unit/apiMocks/apiClientMockFactory');
  var apiMocks = require('../apiMocks/index');

  var MockFetch = require('../fixtures/mockFetch');
  beforeEach(function () {
    ctx = {};
  });
  function setup(scope) {

    ctx.fakeOrg1 = {
      attrs: angular.copy(apiMocks.user),
      oauthName: function () {
        return 'org1';
      }
    };
    ctx.fetchDockerfileFromSourceMock = new MockFetch();
    ctx.populateDockerfile = new MockFetch();
    runnable.reset(apiMocks.user);
    angular.mock.module('app', function ($provide) {
      $provide.factory('helpCards', helpCardsMock.create(ctx));
      $provide.factory('fetchDockerfileFromSource', ctx.fetchDockerfileFromSourceMock.fetch());
      $provide.factory('populateDockerfile', ctx.populateDockerfile.fetch());
      $provide.factory('loadingPromises', function ($q) {
        ctx.loadingPromiseMock = {
          finishedValue: 0,
          add: sinon.spy(function (namespace, promise) {
            console.log('ADD!!!!');
            return promise;
          }),
          clear: sinon.spy(),
          finished: sinon.spy(function () {
            return $q.when(ctx.loadingPromiseMock.finishedValue);
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
      'data': 'data',
      'actions': 'actions',
      'current-model': 'currentModel',
      'state-model': 'stateModel',
      'default-actions': 'defaultActions'

    });
    ctx.element = $compile(ctx.template)($scope);
    $scope.$digest();
    $elScope = ctx.element.isolateScope();
    $scope.$digest();
  }
  describe('basic', function () {
  });

  describe('getUpdatePromise', function () {
    beforeEach(function () {
      ctx.instance = runnable.newInstance(
        apiMocks.instances.running,
        {noStore: true}
      );
      ctx.contextVersion = apiClientMockFactory.contextVersion(
        runnable,
        apiMocks.contextVersions.running
      );
      ctx.newContextVersion = apiClientMockFactory.contextVersion(
        runnable,
        apiMocks.contextVersions.setup
      );
      sinon.stub(ctx.contextVersion, 'deepCopy', function (cb) {
        $rootScope.$evalAsync(function () {
          cb(null, ctx.newContextVersion);
        });
        return ctx.newContextVersion;
      });
      ctx.dockerfile = {
        attrs: apiMocks.files.dockerfile
      };
      ctx.newContextVersion.fetchFile = sinon.spy(function (opts, cb) {
        $rootScope.$evalAsync(function () {
          cb(null, ctx.dockerfile);
        });
        return ctx.dockerfile;
      });
      ctx.build = apiClientMockFactory.build(runnable, apiMocks.contextVersions.running);
      ctx.server = {
        advanced: false,
        startCommand: 'hello',
        ports: '80 900 90',
        selectedStack: {
          hello: 'cheese'
        },
        instance: ctx.instance,
        contextVersion: ctx.contextVersion,
        build: ctx.build
      };

      setup({
        currentModel: ctx.server,
        data: {
          sourceContexts: {
            models: []
          }
        }
      });
    });
    it('should only update the instance if nothing has changed', function () {
      var closePopoverSpy = sinon.spy();
      $rootScope.$on('close-popovers', closePopoverSpy);
      keypather.set($elScope, 'portTagOptions.tags.tags', {
        hello: 'cheese'
      });

      $elScope.getUpdatePromise();
      $scope.$digest();
      sinon.assert.called(closePopoverSpy);
      expect($elScope.building).to.be.true;
      expect($elScope.state.ports).to.be.ok;

    });
  });
});