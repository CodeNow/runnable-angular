/*global runnable:true, mocks: true, directiveTemplate: true, xdescribe: true, helpCardsMock */
'use strict';

describe('serverModalController'.bold.underline.blue, function () {
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

    SMC = $controller('ServerModalController', {
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

  describe('requiresRedeploy', function () {
    beforeEach(function () {
      setup({
        currentModel: ctx.instance,
        selectedTab: 'env'
      });

      keypather.set(SMC, 'state.opts', {
        env: [],
        ipWhitelist: {
          enabled: false
        }
      });
    });

    it('should alwauys be false when there is no instance', function () {
      SMC.instance = null;
      $scope.$digest();
      expect(SMC.requiresRedeploy(), 'requiresRedeploy').to.be.false;
    });

    it('should be false when the instance is missing the whitelist field', function () {
      SMC.instance = {
        env: []
      };
      $scope.$digest();
      expect(SMC.requiresRedeploy(), 'requiresRedeploy').to.be.false;
    });

    it('should be false when the instance is missing the env field', function () {
      SMC.instance = {
        attrs: {
          ipWhitelist: {
            enabled: false
          }
        }
      };
      $scope.$digest();
      expect(SMC.requiresRedeploy(), 'requiresRedeploy').to.be.false;
    });

    it('should be true when the envs dont match ', function () {
      SMC.instance = {
        attrs: {
          env: ['asdasd']
        }
      };
      $scope.$digest();
      expect(SMC.requiresRedeploy(), 'requiresRedeploy').to.be.true;
    });

    it('should be true when the ipWhitelist doesnt match ', function () {
      SMC.instance = {
        attrs: {
          env: ['asdasd'],
          ipWhitelist: {
            enable: true
          }
        }
      };
      $scope.$digest();
      expect(SMC.requiresRedeploy(), 'requiresRedeploy').to.be.true;
    });

  });

});
