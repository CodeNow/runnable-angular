'use strict';

// injector-provided
var $rootScope,
  $scope,
  $compile,
  $timeout,
  $document,
  $localStorage,
  $templateCache;
var $elScope;
var thisUser;
var keypather;

var deepCopyCb;
var buildBuildCb;
var contentsFetchCb;

var apiMocks = require('../../apiMocks/index');
var openItemsMock = {
  add: sinon.spy(),
  removeAndReopen: sinon.spy()
};

function createBuildObject(json) {
  return {
    attrs: angular.copy(json || apiMocks.builds.setup),
    deepCopy: sinon.spy(function (cb) {
      deepCopyCb = cb;
      return createBuildObject(apiMocks.builds.new);
    }),
    build: sinon.spy(function (opts, cb) {
      buildBuildCb = cb;
      createBuildObject(apiMocks.builds.built);
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
function makeDefaultScope() {
  return {
    data: {
      instance: {
        attrs: angular.copy(apiMocks.instances.building)
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
      close: sinon.spy()
    }
  };
}

describe.only('directiveModalEdit'.bold.underline.blue, function () {
  beforeEach(function () {
    deepCopyCb = null;
    buildBuildCb = null;
    contentsFetchCb = null;
    openItemsMock = null;
  });
  var ctx;
  function injectSetupCompile(scope) {
    angular.mock.module('app', function ($provide) {
      $provide.value('OpenItems', function () {
        return openItemsMock;
      });
      $provide.value('eventTracking', {
        triggeredBuild: sinon.spy()
      });
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
      _$rootScope_
    ) {
      $rootScope = _$rootScope_;
      keypather = _keypather_;
      $scope = _$rootScope_.$new();
      $compile = _$compile_;
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
    ctx.template = directiveTemplate.attribute('modal-edit', {
      'data': 'data',
      'default-actions': 'defaultActions'
    });

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
      expect($elScope.state.env, 'state.env').to.be.ok;

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

    it('should paste the url for another instance through the scope', function (done) {
      var scope = makeDefaultScope();
      injectSetupCompile(scope);
      $scope.$digest();

      $elScope.$on('eventPasteLinkedInstance', function (event, url) {
        expect(url, 'url').to.equal('nathan-web-codenow.runnableapp.com');
        done();
      });

      var otherInstance = scope.data.instance;
      keypather.set(otherInstance, 'containers.models[0].urls', function () {
        return ['https://nathan-web-codenow.runnableapp.com:3000'];
      });

      $elScope.popoverLinkServers.actions.pasteDependency(otherInstance);
      $scope.$digest();

    });
  });

  describe('basic functionality', function () {
    beforeEach(function () {
      injectSetupCompile({
        data: {}
      });
    });
    it('should flow normally', function () {
      expect($elScope.state.name, 'state.name').to.not.be.ok;

      var newScope = makeDefaultScope();
      $scope.data = {
        instance: newScope.data.instance,
        build: newScope.data.build
      };
      $scope.$digest();
      expect($elScope.state.name, 'state.name').to.equal(newScope.data.instance.attrs.name);
      //expect($elScope.data.instance.validation).to.be.ok;
      //expect($elScope.data.instance.validation.envs).to.be.ok;


      expect($elScope.build, 'scope build').to.not.be.ok;
      var copiedBuild = createBuildObject(apiMocks.builds.new);
      deepCopyCb(null, copiedBuild);
      $scope.$digest();

      expect($elScope.build, 'Scope build').to.be.ok;
      expect($elScope.build, 'Scope build').to.not.equal($elScope.data.build);
      $scope.$digest();
      //
      //contentsFetchCb();
      //$scope.$digest();
      //
      //expect($elScope.dockerfile, 'dockerfile').to.be.ok;
      //sinon.assert.calledOnce(openItemsMock.add);
      $scope.$destroy();
      $scope.$digest();
    });

  });

});
